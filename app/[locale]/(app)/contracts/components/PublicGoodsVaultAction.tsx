'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { writeContract } from '@wagmi/core';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Loader2, SendHorizontal, Vault } from 'lucide-react';
import { toast } from 'sonner';
import { useConfig, usePublicClient } from 'wagmi';

import { charityWalletAbi as CHARITY_WALLET_ABI } from '@/contracts/abis';
import { formatEthValue, shortenHex } from '@/utils';

import { getEthErrorMessage, isUserRejection, reportError } from '@/utils/errors';
import { assertSuccessfulTransactionReceipt } from '@/utils/transactions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTooltip } from '@/components/ui/info-tooltip';
import { activeChain } from '@/config/chains';
import { useActiveWeb3React } from '@/hooks/web3';
import { useRequireChain } from '@/hooks/useRequireChain';

interface PublicGoodsVaultActionProps {
  vaultAddress: string;
  beneficiaryAddress: string;
  vaultBalanceEth?: number;
}

function toDisplayBalance(value: number | undefined): number {
  if (value == null || !Number.isFinite(value) || value <= 0) return 0;
  return value;
}

export function PublicGoodsVaultAction({
  vaultAddress,
  beneficiaryAddress,
  vaultBalanceEth,
}: PublicGoodsVaultActionProps) {
  const t = useTranslations('contracts');
  const toastT = useTranslations('toasts');
  const locale = useLocale();
  const [submitting, setSubmitting] = useState(false);
  const config = useConfig();
  const publicClient = usePublicClient({ chainId: activeChain.id });
  const queryClient = useQueryClient();
  const { account, active } = useActiveWeb3React();
  const { ensureCorrectChain } = useRequireChain();

  if (!vaultAddress) return null;

  const displayBalance = toDisplayBalance(vaultBalanceEth);
  const hasFunds = displayBalance > 0;
  const disabled = submitting || !hasFunds;
  const buttonLabel = submitting
    ? toastT('contribution.publicGoodsVault.forwarding')
    : hasFunds
      ? toastT('contribution.publicGoodsVault.forward')
      : toastT('contribution.publicGoodsVault.nothing');

  const handleForward = async () => {
    if (!hasFunds) {
      toast.info(toastT('contribution.publicGoodsVault.none'));
      return;
    }

    if (!active || !account) {
      toast.error(toastT('contribution.publicGoodsVault.connectWallet'));
      return;
    }

    if (!(await ensureCorrectChain())) return;

    setSubmitting(true);
    try {
      const hash = await writeContract(config, {
        address: vaultAddress as `0x${string}`,
        abi: CHARITY_WALLET_ABI,
        functionName: 'send',
        args: [],
        account: account as `0x${string}`,
        chainId: activeChain.id,
      });

      const receipt = await publicClient?.waitForTransactionReceipt({ hash });
      assertSuccessfulTransactionReceipt(receipt);
      await queryClient.invalidateQueries({ queryKey: ['dashboardInfo'] });
      toast.success(toastT('contribution.publicGoodsVault.forwarded'));
    } catch (err) {
      if (isUserRejection(err)) {
        toast.info(toastT('walletTransactionCancelled'));
        return;
      }
      reportError(err, 'forward public goods vault funds');
      toast.error(
        getEthErrorMessage(err, toastT('contribution.publicGoodsVault.failed'), { locale }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.06] text-primary/60">
            <Vault className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-semibold">{t('vault.title')}</CardTitle>
          <InfoTooltip content={t('vault.tooltip')} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="text-muted-foreground">{t('vault.balance')}</span>
              <span className="font-mono font-semibold text-foreground">
                {formatEthValue(displayBalance)}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {beneficiaryAddress
                ? t('vault.descriptionWithBeneficiary', {
                    address: shortenHex(beneficiaryAddress, 6),
                  })
                : t('vault.description')}
            </p>
          </div>

          <Button
            type="button"
            onClick={handleForward}
            disabled={disabled}
            aria-label={t('vault.aria')}
            className="w-full md:w-auto"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <SendHorizontal className="h-4 w-4" aria-hidden />
            )}
            {buttonLabel}
            {!submitting && <ArrowUpRight className="h-4 w-4" aria-hidden />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
