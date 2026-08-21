'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAccount, useConfig, useConnectorClient, useSwitchChain, useWalletClient } from 'wagmi';
import { getConnectorClient } from '@wagmi/core';
import { getChainId } from 'viem/actions';
import type { Client } from 'viem';

import { activeChain } from '@/config/chains';
import { useNotify } from '@/hooks/useNotify';
import { isUserRejection } from '@/utils/errors';

export interface UseRequireChainOptions {
  /**
   * Message shown when the wallet could not be moved to the app chain.
   * Defaults to the generic wrong-chain copy; flows with their own wording
   * (the gesture form) pass a localized override.
   */
  switchFailedMessage?: string;
}

export interface RequireChainResult {
  /** Chain the app's contracts are deployed on. */
  requiredChainId: number;
  /** Chain the connected wallet reports, or `null` when no wallet is connected. */
  connectedChainId: number | null;
  /** True only when a wallet IS connected and reports a different chain. */
  isWrongChain: boolean;
  isConnected: boolean;
  /** Explicit, user-initiated switch. Resolves true once the wallet is on the app chain. */
  switchToRequiredChain: () => Promise<boolean>;
  /**
   * Gate for contract writes. Re-reads the chain from the wallet client (not
   * from wagmi's cached state) and, on a mismatch, asks the wallet to switch —
   * which the user still has to approve. Resolves false, having already shown
   * a notification, when the write must not proceed.
   */
  ensureCorrectChain: () => Promise<boolean>;
}

/**
 * Centralised chain guard.
 *
 * `useActiveWeb3React().chainId` reads wagmi's connection state, which
 * resolves to a configured chain even when the wallet itself is elsewhere, so
 * callers cannot tell "on the app chain" from "wagmi assumed the app chain".
 * Every contract write should therefore go through `ensureCorrectChain()`
 * rather than trusting that value, and chain-sensitive UI should read
 * `isWrongChain`.
 *
 * Nothing here switches networks on its own: `ensureCorrectChain` only runs
 * from an action the user already initiated, and the wallet still prompts.
 */
export function useRequireChain(options: UseRequireChainOptions = {}): RequireChainResult {
  const t = useTranslations('toasts');
  const { notify } = useNotify();
  const config = useConfig();
  const { isConnected, chainId: walletChainId } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { data: connectorClient } = useConnectorClient({ chainId: activeChain.id });
  const { data: walletClient } = useWalletClient({ chainId: activeChain.id });

  const requiredChainId: number = activeChain.id;
  const connectedChainId = walletChainId ?? null;
  const isWrongChain =
    Boolean(isConnected) && connectedChainId !== null && connectedChainId !== requiredChainId;
  const switchFailedMessage = options.switchFailedMessage ?? t('network.wrongChain');

  const requestSwitch = useCallback(async (): Promise<boolean> => {
    try {
      await switchChainAsync({ chainId: activeChain.id });
      return true;
    } catch (err) {
      if (isUserRejection(err)) {
        notify('info', t('walletTransactionCancelled'));
      } else {
        notify('error', switchFailedMessage);
      }
      return false;
    }
  }, [notify, switchChainAsync, switchFailedMessage, t]);

  const switchToRequiredChain = useCallback(async (): Promise<boolean> => {
    if (!isConnected) {
      notify('error', t('wallet.connect'));
      return false;
    }
    if (!isWrongChain) return true;
    return requestSwitch();
  }, [isConnected, isWrongChain, notify, requestSwitch, t]);

  const ensureCorrectChain = useCallback(async (): Promise<boolean> => {
    let signer = connectorClient ?? walletClient;
    if (!signer) {
      // Deliberately unpinned: wagmi rejects a pinned `chainId` when the
      // connector is not already on it (`ConnectorChainMismatchError`), and a
      // client on the wallet's *current* chain is exactly what we need to
      // detect the mismatch below.
      try {
        signer = ((await getConnectorClient(config)) as unknown as typeof signer) ?? undefined;
      } catch {
        signer = undefined;
      }
    }
    if (!signer) {
      notify('error', t('wallet.notReady'));
      return false;
    }

    let actualChainId: number | null;
    try {
      actualChainId = await getChainId(signer as Client);
    } catch {
      // Unverifiable. Assuming the app chain here would silently defeat the
      // guard, so fall through to an explicit switch request instead: the
      // wallet resolves it as a no-op when it is already on the right chain.
      actualChainId = null;
    }

    if (actualChainId === requiredChainId) return true;
    return requestSwitch();
  }, [config, connectorClient, notify, requestSwitch, requiredChainId, t, walletClient]);

  return {
    requiredChainId,
    connectedChainId,
    isWrongChain,
    isConnected: Boolean(isConnected),
    switchToRequiredChain,
    ensureCorrectChain,
  };
}
