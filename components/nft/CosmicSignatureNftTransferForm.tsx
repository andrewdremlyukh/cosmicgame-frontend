'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { writeContract } from '@wagmi/core';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Loader2, SendHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { getAddress, isAddress, zeroAddress } from 'viem';
import { useConfig, usePublicClient } from 'wagmi';

import { cosmicSignatureAbi } from '@/contracts/abis';
import { getExplorerUrl, shortenHex } from '@/utils';

import { Link } from '@/i18n/navigation';
import { activeChain } from '@/config/chains';
import { useContractAddresses } from '@/contexts/ContractAddressesContext';
import { useActiveWeb3React } from '@/hooks/web3';
import { useRequireChain } from '@/hooks/useRequireChain';
import { cn } from '@/lib/utils';
import type { CSTTokenInfo } from '@/services/api';
import { getEthErrorMessage, isUserRejection, reportError } from '@/utils/errors';
import { assertSuccessfulTransactionReceipt } from '@/utils/transactions';
import { CustomPagination } from '@/components/common/CustomPagination';
import { NftMarketplaceButton } from '@/components/common/NftMarketplaceButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CosmicSignatureNftTransferFormProps {
  sourceAddress: string | null | undefined;
  tokens: CSTTokenInfo[];
  description?: string;
  historyHref?: string;
}

interface ValidTransfer {
  recipient: `0x${string}`;
  tokenIds: number[];
}

interface TransferProgress {
  total: number;
  completed: number;
  currentTokenId: number | null;
  failedTokenId: number | null;
}

type DisabledReason = 'anchored' | 'ownerChanged';

interface EthereumProvider {
  request: (args: { method: string; params: unknown[] }) => Promise<unknown>;
}

function normalizeAddress(value: string): `0x${string}` | null {
  const trimmed = value.trim();
  if (!isAddress(trimmed)) return null;
  return getAddress(trimmed) as `0x${string}`;
}

function isSameAddress(a: string | null | undefined, b: string | null | undefined): boolean {
  return !!a && !!b && a.toLowerCase() === b.toLowerCase();
}

function isTokenTransferable(token: CSTTokenInfo, sourceAddress: string | null): boolean {
  if (token.Staked) return false;
  if (!sourceAddress || !token.CurOwnerAddr) return true;
  return isSameAddress(token.CurOwnerAddr, sourceAddress);
}

function getDisabledReason(
  token: CSTTokenInfo,
  sourceAddress: string | null,
): DisabledReason | null {
  if (token.Staked) return 'anchored';
  if (sourceAddress && token.CurOwnerAddr && !isSameAddress(token.CurOwnerAddr, sourceAddress)) {
    return 'ownerChanged';
  }
  return null;
}

export function CosmicSignatureNftTransferForm({
  sourceAddress,
  tokens,
  description,
  historyHref,
}: CosmicSignatureNftTransferFormProps) {
  const t = useTranslations('myPages');
  const tToast = useTranslations('toasts');
  const locale = useLocale();
  const resolvedDescription = description ?? t('nftTransfer.defaultDescription');
  const [recipient, setRecipient] = useState('');
  const [page, setPage] = useState(1);
  const [selectedTokenIds, setSelectedTokenIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<TransferProgress | null>(null);
  const [txHashes, setTxHashes] = useState<`0x${string}`[]>([]);
  const [warningOpen, setWarningOpen] = useState(false);
  const [pendingTransfer, setPendingTransfer] = useState<ValidTransfer | null>(null);

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

  const perPage = 8;
  const pageItems = useMemo(() => {
    const startIndex = (page - 1) * perPage;
    return tokens.slice(startIndex, startIndex + perPage);
  }, [page, tokens]);

  const transferableTokenIds = useMemo(
    () =>
      tokens
        .filter((token) => isTokenTransferable(token, normalizedSource))
        .map((token) => token.TokenId),
    [normalizedSource, tokens],
  );

  const selectedTransferableIds = useMemo(
    () => selectedTokenIds.filter((id) => transferableTokenIds.includes(id)),
    [selectedTokenIds, transferableTokenIds],
  );

  useEffect(() => {
    setSelectedTokenIds((current) => current.filter((id) => transferableTokenIds.includes(id)));
  }, [transferableTokenIds]);

  const isSelected = (id: number) => selectedTokenIds.includes(id);

  const handleSelectToggle = (token: CSTTokenInfo) => {
    if (submitting || !isTokenTransferable(token, normalizedSource)) return;
    setSelectedTokenIds((current) =>
      current.includes(token.TokenId)
        ? current.filter((id) => id !== token.TokenId)
        : [...current, token.TokenId],
    );
  };

  const handleSelectAll = () => setSelectedTokenIds(transferableTokenIds);

  const handleSelectCurrentPage = () =>
    setSelectedTokenIds(
      pageItems
        .filter((token) => isTokenTransferable(token, normalizedSource))
        .map((token) => token.TokenId),
    );

  const handleSelectNone = () => setSelectedTokenIds([]);

  const validateTransfer = (): ValidTransfer | null => {
    if (!contractAddrs.cosmicSignature) {
      toast.error(tToast('transfer.nft.contractUnavailable'));
      return null;
    }
    if (!active || !account) {
      toast.error(tToast('transfer.nft.walletRequired'));
      return null;
    }
    if (!normalizedSource) {
      toast.error(tToast('transfer.common.sourceUnavailable'));
      return null;
    }
    if (!isSameAddress(account, normalizedSource)) {
      toast.error(tToast('transfer.nft.sourceWalletRequired'));
      return null;
    }

    const normalizedRecipient = normalizeAddress(recipient);
    if (!normalizedRecipient || normalizedRecipient.toLowerCase() === zeroAddress) {
      toast.error(tToast('transfer.common.invalidRecipient'));
      return null;
    }
    if (isSameAddress(normalizedRecipient, normalizedSource)) {
      toast.error(tToast('transfer.nft.recipientMustDiffer'));
      return null;
    }

    if (selectedTransferableIds.length === 0) {
      toast.error(tToast('transfer.nft.selectOne'));
      return null;
    }

    return { recipient: normalizedRecipient, tokenIds: selectedTransferableIds };
  };

  const shouldWarnForNewRecipient = async (address: `0x${string}`): Promise<boolean> => {
    const ethereum = (window as Window & { ethereum?: EthereumProvider }).ethereum;
    if (!ethereum) return false;

    try {
      const txCount = await ethereum.request({
        method: 'eth_getTransactionCount',
        params: [address, 'latest'],
      });
      return Number(txCount) === 0;
    } catch (err) {
      reportError(err, 'check NFT transfer destination');
      return false;
    }
  };

  const invalidateTransferQueries = async (
    transferredIds: number[],
    recipientAddress: `0x${string}`,
  ) => {
    if (!normalizedSource) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['cstTokensByUser', normalizedSource] }),
      queryClient.invalidateQueries({ queryKey: ['cstTokensByUser', recipientAddress] }),
      queryClient.invalidateQueries({ queryKey: ['cstTransfers', normalizedSource] }),
      queryClient.invalidateQueries({ queryKey: ['cstTransfers', recipientAddress] }),
      ...transferredIds.map((tokenId) =>
        queryClient.invalidateQueries({ queryKey: ['cstInfo', tokenId] }),
      ),
    ]);
  };

  const executeTransfer = async (validTransfer: ValidTransfer) => {
    if (!normalizedSource || !contractAddrs.cosmicSignature) return;
    // Checked once for the whole batch; every token below is signed in sequence.
    if (!(await ensureCorrectChain())) return;

    setSubmitting(true);
    setTxHashes([]);
    setProgress({
      total: validTransfer.tokenIds.length,
      completed: 0,
      currentTokenId: validTransfer.tokenIds[0] ?? null,
      failedTokenId: null,
    });

    const transferredIds: number[] = [];
    const confirmedHashes: `0x${string}`[] = [];
    let currentTokenId: number | null = null;

    try {
      for (const [index, tokenId] of validTransfer.tokenIds.entries()) {
        currentTokenId = tokenId;
        setProgress({
          total: validTransfer.tokenIds.length,
          completed: index,
          currentTokenId: tokenId,
          failedTokenId: null,
        });

        const hash = await writeContract(config, {
          address: contractAddrs.cosmicSignature as `0x${string}`,
          abi: cosmicSignatureAbi,
          functionName: 'transferFrom',
          args: [normalizedSource, validTransfer.recipient, BigInt(tokenId)],
          account: normalizedSource,
          chainId: activeChain.id,
        });

        const receipt = await publicClient?.waitForTransactionReceipt({ hash });
        assertSuccessfulTransactionReceipt(receipt);
        transferredIds.push(tokenId);
        confirmedHashes.push(hash);
        setProgress({
          total: validTransfer.tokenIds.length,
          completed: index + 1,
          currentTokenId: tokenId,
          failedTokenId: null,
        });
      }

      setSelectedTokenIds([]);
      setRecipient('');
      toast.success(tToast('transfer.nft.confirmed', { count: validTransfer.tokenIds.length }));
    } catch (err) {
      setProgress((current) =>
        current
          ? {
              ...current,
              failedTokenId: currentTokenId,
            }
          : current,
      );

      if (isUserRejection(err)) {
        toast.info(tToast('walletTransactionCancelled'));
      } else {
        reportError(err, 'Cosmic Signature NFT transfer');
        toast.error(
          getEthErrorMessage(
            err,
            currentTokenId == null
              ? tToast('transfer.nft.failed')
              : tToast('transfer.nft.failedToken', { tokenId: currentTokenId }),
            { locale },
          ),
        );
      }

      if (transferredIds.length > 0) {
        setSelectedTokenIds((current) => current.filter((id) => !transferredIds.includes(id)));
      }
    } finally {
      if (transferredIds.length > 0) {
        setTxHashes(confirmedHashes);
        await invalidateTransferQueries(transferredIds, validTransfer.recipient);
      }
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validTransfer = validateTransfer();
    if (!validTransfer) return;

    if (await shouldWarnForNewRecipient(validTransfer.recipient)) {
      setPendingTransfer(validTransfer);
      setWarningOpen(true);
      return;
    }

    await executeTransfer(validTransfer);
  };

  const handleConfirmNewRecipient = async () => {
    if (!pendingTransfer) return;
    setWarningOpen(false);
    setPendingTransfer(null);
    await executeTransfer(pendingTransfer);
  };

  const submitDisabled =
    submitting ||
    !active ||
    !account ||
    !normalizedSource ||
    !contractAddrs.cosmicSignature ||
    selectedTransferableIds.length === 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardDescription>{resolvedDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/15 bg-primary/[0.045] p-4 text-sm">
            <p className="max-w-md text-muted-foreground">{t('nftTransfer.marketplacePrompt')}</p>
            <NftMarketplaceButton variant="compact" label={t('nftTransfer.marketplace')} />
          </div>
          <div className="mb-6 grid gap-3 rounded-lg border border-white/[0.06] bg-white/[0.025] p-4 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {t('nftTransfer.sourceWallet')}
              </p>
              <p className="mt-1 font-mono text-foreground">
                {normalizedSource ? shortenHex(normalizedSource, 6) : t('shared.unavailable')}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {t('nftTransfer.ownedNfts')}
              </p>
              <p className="mt-1 font-semibold text-foreground">{tokens.length}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {t('nftTransfer.selected')}
              </p>
              <p className="mt-1 font-semibold text-foreground">{selectedTransferableIds.length}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="nft-recipient">{t('nftTransfer.recipientAddress')}</Label>
              <Input
                id="nft-recipient"
                value={recipient}
                onChange={(event) => setRecipient(event.target.value)}
                placeholder="0x..."
                autoComplete="off"
                disabled={submitting}
              />
            </div>

            {tokens.length === 0 ? (
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5 text-sm text-muted-foreground">
                {t('nftTransfer.empty')}
              </div>
            ) : (
              <div className="space-y-4" data-testid="nft-transfer-picker">
                <div className="flex flex-col gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">{t('nftTransfer.pickerTitle')}</p>
                    <p>
                      {t('nftTransfer.pickerSummary', {
                        selected: selectedTransferableIds.length,
                        total: transferableTokenIds.length,
                      })}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={submitting || transferableTokenIds.length === 0}
                      onClick={handleSelectAll}
                    >
                      {t('nftTransfer.selectAll')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={submitting || pageItems.length === 0}
                      onClick={handleSelectCurrentPage}
                    >
                      {t('nftTransfer.selectPage')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={submitting || selectedTransferableIds.length === 0}
                      onClick={handleSelectNone}
                    >
                      {t('nftTransfer.clear')}
                    </Button>
                  </div>
                </div>

                <div className="space-y-3" aria-label={t('nftTransfer.listAria')}>
                  {pageItems.map((token) => {
                    const disabledReason = getDisabledReason(token, normalizedSource);
                    const disabledReasonLabel =
                      disabledReason === 'anchored'
                        ? t('nftTransfer.statusLabels.anchored')
                        : disabledReason === 'ownerChanged'
                          ? t('nftTransfer.statusLabels.ownerChanged')
                          : null;
                    const transferable = disabledReason == null;
                    const selected = isSelected(token.TokenId);

                    return (
                      <div
                        key={`${token.EvtLogId}-${token.TokenId}`}
                        data-testid={`nft-row-${token.TokenId}`}
                        onClick={() => handleSelectToggle(token)}
                        className={cn(
                          'grid gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm transition-colors sm:grid-cols-[auto_minmax(5rem,0.7fr)_minmax(12rem,1.8fr)_minmax(5rem,0.7fr)_minmax(10rem,1fr)] sm:items-center',
                          transferable && !submitting
                            ? 'cursor-pointer hover:bg-white/[0.055]'
                            : 'cursor-not-allowed opacity-60',
                          selected && 'border-primary/40 bg-primary/[0.08]',
                        )}
                      >
                        <div
                          className="flex items-center gap-3"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Checkbox
                            checked={selected}
                            disabled={!transferable || submitting}
                            aria-label={t('nftTransfer.selectAria', { id: token.TokenId })}
                            className="h-4 w-4"
                            onChange={() => handleSelectToggle(token)}
                          />
                          <span className="font-medium text-foreground sm:hidden">
                            {t('nftTransfer.nftLabel', { id: token.TokenId })}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground sm:hidden">
                            {t('nftTransfer.tokenId')}
                          </p>
                          <Link
                            href={`/detail/${token.TokenId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-foreground underline-offset-4 hover:underline"
                            onClick={(event) => event.stopPropagation()}
                          >
                            #{token.TokenId}
                          </Link>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            {t('nftTransfer.customName')}
                          </p>
                          <p className="mt-1 text-foreground">
                            {token.TokenName ? token.TokenName : t('nftTransfer.noCustomName')}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">
                            {t('nftTransfer.generationCycle')}
                          </p>
                          {token.RoundNum != null ? (
                            <Link
                              href={`/allocation/${token.RoundNum}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex text-foreground underline-offset-4 hover:underline"
                              onClick={(event) => event.stopPropagation()}
                            >
                              {t('nftTransfer.cycle', { cycle: token.RoundNum })}
                            </Link>
                          ) : (
                            <span className="mt-1 inline-flex text-muted-foreground">
                              {t('nftTransfer.cycleUnavailable')}
                            </span>
                          )}
                        </div>

                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground sm:hidden">
                            {t('nftTransfer.status')}
                          </p>
                          <span
                            className={cn(
                              'inline-flex rounded-full border px-2 py-1 text-xs font-medium',
                              disabledReason
                                ? 'border-amber-400/30 bg-amber-400/10 text-amber-200'
                                : selected
                                  ? 'border-primary/40 bg-primary/10 text-primary'
                                  : 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
                            )}
                          >
                            {disabledReasonLabel ??
                              (selected
                                ? t('nftTransfer.statusLabels.selected')
                                : t('nftTransfer.statusLabels.transferable'))}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <CustomPagination
                  page={page}
                  setPage={setPage}
                  totalLength={tokens.length}
                  perPage={perPage}
                />
              </div>
            )}

            {progress ? (
              <div
                className={cn(
                  'rounded-lg border p-4 text-sm',
                  progress.failedTokenId == null
                    ? 'border-white/[0.08] bg-white/[0.03]'
                    : 'border-destructive/30 bg-destructive/10',
                )}
                role="status"
              >
                <p className="font-medium text-foreground">
                  {progress.failedTokenId == null
                    ? t('nftTransfer.progress.transferred', {
                        completed: progress.completed,
                        total: progress.total,
                      })
                    : t('nftTransfer.progress.stopped', { id: progress.failedTokenId })}
                </p>
                {progress.currentTokenId != null && progress.failedTokenId == null ? (
                  <p className="mt-1 text-muted-foreground">
                    {t('nftTransfer.progress.current', { id: progress.currentTokenId })}
                  </p>
                ) : null}
              </div>
            ) : null}

            {txHashes.length > 0 ? (
              <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/[0.06] p-4 text-sm">
                <p className="font-medium text-emerald-200">
                  {txHashes.length === 1
                    ? t('nftTransfer.confirmation.latest')
                    : t('nftTransfer.confirmation.multiple', { count: txHashes.length })}
                </p>
                <a
                  href={getExplorerUrl('tx', txHashes[txHashes.length - 1]!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
                >
                  {t('nftTransfer.confirmation.viewLatest')}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </a>
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="submit"
                disabled={submitDisabled}
                aria-label={t('nftTransfer.sendAria')}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <SendHorizontal className="h-4 w-4" aria-hidden />
                )}
                {submitting ? t('nftTransfer.sending') : t('nftTransfer.send')}
              </Button>

              {historyHref ? (
                <a
                  href={historyHref}
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {t('nftTransfer.viewHistory')}
                </a>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={warningOpen} onOpenChange={setWarningOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('nftTransfer.warning.title')}</DialogTitle>
            <DialogDescription>{t('nftTransfer.warning.description')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWarningOpen(false)}>
              {t('nftTransfer.warning.cancel')}
            </Button>
            <Button onClick={handleConfirmNewRecipient}>{t('nftTransfer.warning.continue')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
