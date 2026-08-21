'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { writeContract } from '@wagmi/core';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Loader2, SendHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { formatUnits, getAddress, isAddress, parseUnits, zeroAddress } from 'viem';
import { useConfig, usePublicClient } from 'wagmi';

import { cosmicTokenAbi } from '@/contracts/abis';
import { getExplorerUrl, shortenHex } from '@/utils';

import { activeChain } from '@/config/chains';
import { useContractAddresses } from '@/contexts/ContractAddressesContext';
import { useActiveWeb3React } from '@/hooks/web3';
import { useRequireChain } from '@/hooks/useRequireChain';
import { getEthErrorMessage, isUserRejection, reportError } from '@/utils/errors';
import { assertSuccessfulTransactionReceipt } from '@/utils/transactions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CstTransferFormProps {
  sourceAddress: string | null | undefined;
  sourceLabel?: string;
  description?: string;
  historyHref?: string;
}

interface ValidTransfer {
  recipient: `0x${string}`;
  amountWei: bigint;
}

function normalizeAddress(value: string): `0x${string}` | null {
  const trimmed = value.trim();
  if (!isAddress(trimmed)) return null;
  return getAddress(trimmed) as `0x${string}`;
}

function formatCstUnits(value: bigint | null, decimals: number): string {
  if (value == null) return '...';
  const formatted = Number(formatUnits(value, decimals));
  if (!Number.isFinite(formatted)) return formatUnits(value, decimals);
  return formatted < 10 ? formatted.toFixed(4) : formatted.toFixed(2);
}

export function CstTransferForm({
  sourceAddress,
  sourceLabel,
  description,
  historyHref,
}: CstTransferFormProps) {
  const t = useTranslations('myPages');
  const tToast = useTranslations('toasts');
  const locale = useLocale();
  const resolvedSourceLabel = sourceLabel ?? t('transferCst.form.sourceWallet');
  const resolvedDescription = description ?? t('transferCst.form.defaultDescription');
  const decimalsReadWarning = tToast('transfer.cst.decimalsWarning');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [decimals, setDecimals] = useState(18);
  const [balanceWei, setBalanceWei] = useState<bigint | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceError, setBalanceError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);

  const config = useConfig();
  const publicClient = usePublicClient({ chainId: activeChain.id });
  const queryClient = useQueryClient();
  const contractAddrs = useContractAddresses();
  const { account, active } = useActiveWeb3React();
  const { ensureCorrectChain } = useRequireChain();

  const normalizedSource = useMemo(() => {
    if (!sourceAddress) return null;
    return normalizeAddress(sourceAddress);
  }, [sourceAddress]);

  useEffect(() => {
    if (!publicClient || !contractAddrs.cosmicToken || !normalizedSource) {
      setBalanceWei(null);
      return;
    }

    let cancelled = false;
    const loadBalance = async () => {
      setBalanceLoading(true);
      setBalanceError(false);

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
          reportError(err, 'Cosmic Signature CST decimals read');
          toast.warning(decimalsReadWarning);
        }

        const balance = (await publicClient.readContract({
          address: contractAddrs.cosmicToken as `0x${string}`,
          abi: cosmicTokenAbi,
          functionName: 'balanceOf',
          args: [normalizedSource],
        })) as bigint;

        if (!cancelled) {
          setDecimals(Number.isFinite(nextDecimals) ? nextDecimals : 18);
          setBalanceWei(balance);
        }
      } catch (err) {
        reportError(err, 'Cosmic Signature CST balance read');
        if (!cancelled) {
          setBalanceWei(null);
          setBalanceError(true);
        }
      } finally {
        if (!cancelled) setBalanceLoading(false);
      }
    };

    void loadBalance();

    return () => {
      cancelled = true;
    };
  }, [contractAddrs.cosmicToken, decimalsReadWarning, normalizedSource, publicClient]);

  const validateTransfer = (): ValidTransfer | null => {
    if (!contractAddrs.cosmicToken) {
      toast.error(tToast('transfer.cst.tokenUnavailable'));
      return null;
    }
    if (!active || !account) {
      toast.error(tToast('transfer.cst.walletRequired'));
      return null;
    }
    if (!normalizedSource) {
      toast.error(tToast('transfer.common.sourceUnavailable'));
      return null;
    }
    if (account.toLowerCase() !== normalizedSource.toLowerCase()) {
      toast.error(tToast('transfer.cst.sourceWalletRequired'));
      return null;
    }

    const normalizedRecipient = normalizeAddress(recipient);
    if (!normalizedRecipient || normalizedRecipient.toLowerCase() === zeroAddress) {
      toast.error(tToast('transfer.common.invalidRecipient'));
      return null;
    }

    const amountText = amount.trim();
    if (!/^\d+(\.\d+)?$/.test(amountText)) {
      toast.error(tToast('transfer.common.invalidAmount'));
      return null;
    }

    let amountWei: bigint;
    try {
      amountWei = parseUnits(amountText, decimals);
    } catch {
      toast.error(tToast('transfer.common.invalidDecimals'));
      return null;
    }

    if (amountWei <= 0n) {
      toast.error(tToast('transfer.common.amountPositive'));
      return null;
    }
    if (balanceWei == null) {
      toast.error(tToast('transfer.cst.balanceLoading'));
      return null;
    }
    if (amountWei > balanceWei) {
      toast.error(tToast('transfer.cst.insufficientBalance'));
      return null;
    }

    return { recipient: normalizedRecipient, amountWei };
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validTransfer = validateTransfer();
    if (!validTransfer) return;
    if (!(await ensureCorrectChain())) return;

    setSubmitting(true);
    setTxHash(null);
    try {
      const hash = await writeContract(config, {
        address: contractAddrs.cosmicToken as `0x${string}`,
        abi: cosmicTokenAbi,
        functionName: 'transfer',
        args: [validTransfer.recipient, validTransfer.amountWei],
        account: account as `0x${string}`,
        chainId: activeChain.id,
      });

      const receipt = await publicClient?.waitForTransactionReceipt({ hash });
      assertSuccessfulTransactionReceipt(receipt);
      setTxHash(hash);
      setRecipient('');
      setAmount('');
      setBalanceWei((current) => (current == null ? current : current - validTransfer.amountWei));

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['userBalance', normalizedSource] }),
        queryClient.invalidateQueries({ queryKey: ['userBalance', validTransfer.recipient] }),
        queryClient.invalidateQueries({ queryKey: ['ctTransfers', normalizedSource] }),
        queryClient.invalidateQueries({ queryKey: ['ctTransfers', validTransfer.recipient] }),
        queryClient.invalidateQueries({ queryKey: ['ctBalancesDistribution'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboardInfo'] }),
      ]);

      toast.success(tToast('transfer.cst.confirmed'));
    } catch (err) {
      if (isUserRejection(err)) {
        toast.info(tToast('walletTransactionCancelled'));
        return;
      }
      reportError(err, 'Cosmic Signature CST transfer');
      toast.error(getEthErrorMessage(err, tToast('transfer.cst.failed'), { locale }));
    } finally {
      setSubmitting(false);
    }
  };

  const submitDisabled =
    submitting ||
    balanceLoading ||
    !active ||
    !account ||
    !normalizedSource ||
    !contractAddrs.cosmicToken ||
    Boolean(balanceError);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('transferCst.form.title')}</CardTitle>
        <CardDescription>{resolvedDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid gap-3 rounded-lg border border-white/[0.06] bg-white/[0.025] p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {resolvedSourceLabel}
            </p>
            <p className="mt-1 font-mono text-foreground">
              {normalizedSource ? shortenHex(normalizedSource, 6) : t('shared.unavailable')}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {t('transferCst.form.available')}
            </p>
            <p className="mt-1 font-semibold text-foreground">
              {balanceLoading ? t('shared.loading') : `${formatCstUnits(balanceWei, decimals)} CST`}
            </p>
          </div>
        </div>

        {balanceError ? (
          <p className="mb-4 text-sm text-destructive">{t('transferCst.form.balanceReadError')}</p>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="cst-recipient">{t('transferCst.form.recipientAddress')}</Label>
            <Input
              id="cst-recipient"
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="0x..."
              autoComplete="off"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cst-amount">{t('transferCst.form.amount')}</Label>
            <Input
              id="cst-amount"
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
              aria-label={t('transferCst.form.sendAria')}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <SendHorizontal className="h-4 w-4" aria-hidden />
              )}
              {submitting ? t('transferCst.form.sending') : t('transferCst.form.send')}
            </Button>

            {historyHref ? (
              <a
                href={historyHref}
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {t('transferCst.form.viewHistory')}
              </a>
            ) : null}
          </div>
        </form>

        {txHash ? (
          <div className="mt-5 rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] p-4 text-sm">
            <p className="font-medium text-emerald-200">{t('transferCst.form.confirmed')}</p>
            <a
              href={getExplorerUrl('tx', txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
            >
              {t('transferCst.form.viewTransaction')}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </a>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
