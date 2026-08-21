'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { writeContract } from '@wagmi/core';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Loader2, SendHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { formatUnits, getAddress, isAddress, parseUnits, zeroAddress } from 'viem';
import { useConfig, usePublicClient } from 'wagmi';

import { cosmicTokenAbi, marketingWalletAbi } from '@/contracts/abis';
import { getExplorerUrl, shortenHex } from '@/utils';

import { activeChain } from '@/config/chains';
import { useContractAddresses } from '@/contexts/ContractAddressesContext';
import { useActiveWeb3React } from '@/hooks/web3';
import { useRequireChain } from '@/hooks/useRequireChain';
import { Link } from '@/i18n/navigation';
import { getEthErrorMessage, isUserRejection, reportError } from '@/utils/errors';
import { assertSuccessfulTransactionReceipt } from '@/utils/transactions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MarketingCstRewardFormProps {
  marketingWalletAddress: string | null | undefined;
  ownerAddress: string | null | undefined;
  treasurerAddress: string | null | undefined;
  historyHref?: string;
}

interface ValidReward {
  recipient: `0x${string}`;
  amountWei: bigint;
}

function normalizeAddress(value: string | null | undefined): `0x${string}` | null {
  const trimmed = value?.trim() ?? '';
  if (!isAddress(trimmed)) return null;
  return getAddress(trimmed) as `0x${string}`;
}

function formatCstUnits(value: bigint | null, decimals: number): string {
  if (value == null) return '...';
  const formatted = Number(formatUnits(value, decimals));
  if (!Number.isFinite(formatted)) return formatUnits(value, decimals);
  return formatted < 10 ? formatted.toFixed(4) : formatted.toFixed(2);
}

export function MarketingCstRewardForm({
  marketingWalletAddress,
  ownerAddress,
  treasurerAddress,
  historyHref,
}: MarketingCstRewardFormProps) {
  const t = useTranslations('toasts');
  const tMarketing = useTranslations('marketing');
  const locale = useLocale();
  const decimalsReadWarning = t('transfer.marketingCst.decimalsWarning');
  const balanceReadFailed = t('transfer.marketingCst.balanceReadFailed');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [decimals, setDecimals] = useState(18);
  const [balanceWei, setBalanceWei] = useState<bigint | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const config = useConfig();
  const publicClient = usePublicClient({ chainId: activeChain.id });
  const queryClient = useQueryClient();
  const contractAddrs = useContractAddresses();
  const { account, active } = useActiveWeb3React();
  const { ensureCorrectChain } = useRequireChain();

  const normalizedMarketingWallet = useMemo(
    () => normalizeAddress(marketingWalletAddress),
    [marketingWalletAddress],
  );
  const normalizedOwner = useMemo(() => normalizeAddress(ownerAddress), [ownerAddress]);
  const normalizedTreasurer = useMemo(() => normalizeAddress(treasurerAddress), [treasurerAddress]);

  useEffect(() => {
    if (!publicClient || !contractAddrs.cosmicToken || !normalizedMarketingWallet) {
      setBalanceWei(null);
      return;
    }

    let cancelled = false;
    const loadBalance = async () => {
      setBalanceLoading(true);
      setBalanceError(null);

      try {
        let nextDecimals = 18;
        try {
          nextDecimals = Number(
            await publicClient.readContract({
              address: contractAddrs.cosmicToken as `0x${string}`,
              abi: cosmicTokenAbi,
              functionName: 'decimals',
            }),
          );
        } catch (err) {
          reportError(err, 'MarketingWallet CST decimals read');
          toast.warning(decimalsReadWarning);
        }

        const balance = (await publicClient.readContract({
          address: contractAddrs.cosmicToken as `0x${string}`,
          abi: cosmicTokenAbi,
          functionName: 'balanceOf',
          args: [normalizedMarketingWallet],
        })) as bigint;

        if (!cancelled) {
          setDecimals(Number.isFinite(nextDecimals) ? nextDecimals : 18);
          setBalanceWei(balance);
        }
      } catch (err) {
        reportError(err, 'MarketingWallet CST balance read');
        if (!cancelled) {
          setBalanceWei(null);
          setBalanceError(balanceReadFailed);
        }
      } finally {
        if (!cancelled) setBalanceLoading(false);
      }
    };

    void loadBalance();

    return () => {
      cancelled = true;
    };
  }, [
    balanceReadFailed,
    contractAddrs.cosmicToken,
    decimalsReadWarning,
    normalizedMarketingWallet,
    publicClient,
  ]);

  const validateReward = (): ValidReward | null => {
    if (!contractAddrs.cosmicToken) {
      toast.error(t('transfer.marketingCst.tokenUnavailable'));
      return null;
    }
    if (!active || !account) {
      toast.error(t('transfer.marketingCst.walletRequired'));
      return null;
    }
    if (!normalizedMarketingWallet) {
      toast.error(t('transfer.marketingCst.reserveUnavailable'));
      return null;
    }
    if (!normalizedTreasurer) {
      toast.error(t('transfer.marketingCst.treasurerUnavailable'));
      return null;
    }
    if (account.toLowerCase() !== normalizedTreasurer.toLowerCase()) {
      toast.error(t('transfer.marketingCst.treasurerRequired'));
      return null;
    }

    const normalizedRecipient = normalizeAddress(recipient);
    if (!normalizedRecipient || normalizedRecipient.toLowerCase() === zeroAddress) {
      toast.error(t('transfer.common.invalidRecipient'));
      return null;
    }

    const amountText = amount.trim();
    if (!/^\d+(\.\d+)?$/.test(amountText)) {
      toast.error(t('transfer.common.invalidAmount'));
      return null;
    }

    let amountWei: bigint;
    try {
      amountWei = parseUnits(amountText, decimals);
    } catch {
      toast.error(t('transfer.common.invalidDecimals'));
      return null;
    }

    if (amountWei <= 0n) {
      toast.error(t('transfer.common.amountPositive'));
      return null;
    }
    if (balanceWei == null) {
      toast.error(t('transfer.marketingCst.balanceLoading'));
      return null;
    }
    if (amountWei > balanceWei) {
      toast.error(t('transfer.marketingCst.insufficientBalance'));
      return null;
    }

    return { recipient: normalizedRecipient, amountWei };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validReward = validateReward();
    if (!validReward || !normalizedMarketingWallet) return;
    if (!(await ensureCorrectChain())) return;

    setSubmitting(true);
    setTxHash(null);
    try {
      const hash = await writeContract(config, {
        address: normalizedMarketingWallet,
        abi: marketingWalletAbi,
        functionName: 'payReward',
        args: [validReward.recipient, validReward.amountWei],
        account: account as `0x${string}`,
        chainId: activeChain.id,
      });

      const receipt = await publicClient?.waitForTransactionReceipt({ hash });
      assertSuccessfulTransactionReceipt(receipt);
      setTxHash(hash);
      setRecipient('');
      setAmount('');
      setBalanceWei((current) => (current == null ? current : current - validReward.amountWei));

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['userBalance', normalizedMarketingWallet] }),
        queryClient.invalidateQueries({ queryKey: ['userBalance', validReward.recipient] }),
        queryClient.invalidateQueries({ queryKey: ['ctTransfers', normalizedMarketingWallet] }),
        queryClient.invalidateQueries({ queryKey: ['ctTransfers', validReward.recipient] }),
        queryClient.invalidateQueries({ queryKey: ['ctBalancesDistribution'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboardInfo'] }),
      ]);

      toast.success(t('transfer.marketingCst.confirmed'));
    } catch (err) {
      if (isUserRejection(err)) {
        toast.info(t('walletTransactionCancelled'));
        return;
      }
      reportError(err, 'MarketingWallet payReward');
      toast.error(getEthErrorMessage(err, t('transfer.marketingCst.failed'), { locale }));
    } finally {
      setSubmitting(false);
    }
  };

  const submitDisabled =
    submitting ||
    balanceLoading ||
    !active ||
    !account ||
    !normalizedMarketingWallet ||
    !normalizedTreasurer ||
    !contractAddrs.cosmicToken ||
    Boolean(balanceError);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tMarketing('transferForm.title')}</CardTitle>
        <CardDescription>{tMarketing('transferForm.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid gap-3 rounded-lg border border-white/[0.06] bg-white/[0.025] p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {tMarketing('transferForm.reserveLabel')}
            </p>
            <p className="mt-1 font-mono text-foreground">
              {normalizedMarketingWallet
                ? shortenHex(normalizedMarketingWallet, 6)
                : tMarketing('transferForm.unavailable')}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {tMarketing('transferForm.availableLabel')}
            </p>
            <p className="mt-1 font-semibold text-foreground">
              {balanceLoading
                ? t('transfer.marketingCst.loading')
                : `${formatCstUnits(balanceWei, decimals)} CST`}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {tMarketing('transferForm.ownerLabel')}
            </p>
            <p className="mt-1 font-mono text-foreground">
              {normalizedOwner
                ? shortenHex(normalizedOwner, 6)
                : tMarketing('transferForm.unavailable')}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {tMarketing('transferForm.treasurerLabel')}
            </p>
            <p className="mt-1 font-mono text-foreground">
              {normalizedTreasurer
                ? shortenHex(normalizedTreasurer, 6)
                : tMarketing('transferForm.unavailable')}
            </p>
          </div>
        </div>

        {balanceError ? <p className="mb-4 text-sm text-destructive">{balanceError}</p> : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="marketing-cst-recipient">
              {tMarketing('transferForm.recipientLabel')}
            </Label>
            <Input
              id="marketing-cst-recipient"
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="0x..."
              autoComplete="off"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="marketing-cst-amount">{tMarketing('transferForm.amountLabel')}</Label>
            <Input
              id="marketing-cst-amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              autoComplete="off"
              disabled={submitting}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="submit"
              disabled={submitDisabled}
              aria-label={t('transfer.marketingCst.pay')}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <SendHorizontal className="h-4 w-4" aria-hidden />
              )}
              {submitting ? t('transfer.marketingCst.paying') : t('transfer.marketingCst.pay')}
            </Button>

            {historyHref ? (
              <Link
                href={historyHref}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {tMarketing('transferForm.historyLink')}
              </Link>
            ) : null}
          </div>
        </form>

        {txHash ? (
          <div className="mt-5 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] p-4 text-sm">
            <p className="font-medium text-emerald-200">{t('transfer.marketingCst.confirmed')}</p>
            <a
              href={getExplorerUrl('tx', txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
            >
              {t('transfer.marketingCst.viewTransaction')}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
