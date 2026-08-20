import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useConfig, usePublicClient, useWalletClient, useConnectorClient } from 'wagmi';
import { getConnectorClient, writeContract } from '@wagmi/core';
import { formatEther, isAddress, maxUint256, parseEther, parseUnits } from 'viem';

import { randomWalkNftAbi as NFT_ABI, cosmicTokenAbi as ERC20_ABI } from '@/contracts/abis';
import { cosmicGameAbi } from '@/contracts/abis';

import { formatSeconds } from '@/utils/format';
import api from '@/services/api';
import useCosmicGameContract from '@/hooks/useCosmicGameContract';
import useRWLKNFTContract from '@/hooks/useRWLKNFTContract';
import { useActiveWeb3React } from '@/hooks/web3';
import { activeChain } from '@/config/chains';
import { useContractAddresses } from '@/contexts/ContractAddressesContext';
import { ERC721_INTERFACE_ID, GESTURE_GAS_LIMIT } from '@/config/constants';
import {
  isTransientNetworkError,
  isUserRejection,
  reportError,
  reportErrorThrottled,
} from '@/utils/errors';
import {
  formatCustomContractError,
  getContractErrorDescriptor,
  isContractRevertError,
} from '@/utils/contractErrors';
import { assertSuccessfulTransactionReceipt } from '@/utils/transactions';
import {
  type CosmicGameGestureFunctionName,
  isMissingFunctionReadError,
  pickGestureWriteAbi,
  readCosmicGameWithFallback,
  withGestureArgsV1ThenV2,
} from '@/utils/cosmicGameContractCompat';
import { useNotify } from '@/hooks/useNotify';
import { useRequireChain } from '@/hooks/useRequireChain';
import { useCTPrice, useGestureEthCost, useUsedRWLKNFTs } from '@/hooks/useApiQuery';
import { mapCTPriceInfo, type CstAuctionDurations, type CstGestureData } from '@/utils/cstGesture';
import { useUxScenarioSnapshot } from '@/lib/uxCycleScenarios';

export type { CstGestureData } from '@/utils/cstGesture';
export type CSTGestureData = CstGestureData;

export interface EthGestureInfo {
  AuctionDuration: number;
  ETHPrice: number;
  SecondsElapsed: number;
}

const CST_REWARD_PREVIEW_REFRESH_MS = 1_000;

interface LiveCstPreviewTestGlobals {
  expect?: unknown;
  __COSMIC_ENABLE_LIVE_CST_PREVIEW_TEST_TIMERS__?: boolean;
  __COSMIC_LIVE_CST_PREVIEW_TEST_INTERVAL_MS__?: number;
}

function shouldScheduleLiveCstPreviewTimer(): boolean {
  const testGlobals = globalThis as LiveCstPreviewTestGlobals;
  const isJest = typeof testGlobals.expect === 'function';
  return !isJest || testGlobals.__COSMIC_ENABLE_LIVE_CST_PREVIEW_TEST_TIMERS__ === true;
}

function getLiveCstPreviewRefreshMs(): number {
  const testInterval = (globalThis as LiveCstPreviewTestGlobals)
    .__COSMIC_LIVE_CST_PREVIEW_TEST_INTERVAL_MS__;
  if (typeof testInterval === 'number' && Number.isFinite(testInterval) && testInterval > 0) {
    return testInterval;
  }
  return CST_REWARD_PREVIEW_REFRESH_MS;
}

export function useGestureForm() {
  const t = useTranslations('toasts');
  const locale = useLocale();
  const contractAddrs = useContractAddresses();
  const config = useConfig();
  const { account } = useActiveWeb3React();
  const publicClient = usePublicClient({ chainId: activeChain.id });
  const { data: connectorClient } = useConnectorClient({ chainId: activeChain.id });
  const { data: walletClient } = useWalletClient({ chainId: activeChain.id });
  const client = (connectorClient ?? walletClient) as ReturnType<typeof useWalletClient>['data'];
  const cosmicGameContract = useCosmicGameContract();
  const nftRWLKContract = useRWLKNFTContract();
  const { notify, notifyErrorFromEthers } = useNotify();
  const { ensureCorrectChain } = useRequireChain({
    switchFailedMessage: t('network.switchForGesture'),
  });
  const uxScenario = useUxScenarioSnapshot();

  const { data: ctPriceData } = useCTPrice();
  const { data: bidEthPriceData } = useGestureEthCost();
  const { data: usedRWLKData } = useUsedRWLKNFTs();

  const [gestureType, setBidType] = useState('ETH');
  const [contributionType, setContributionType] = useState('NFT');
  const [message, setMessage] = useState('');
  const [nftDonateAddress, setNftDonateAddress] = useState('');
  const [nftId, setNftId] = useState('');
  const [tokenDonateAddress, setTokenDonateAddress] = useState('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [rwlkId, setRwlkId] = useState(-1);
  const [gestureCostPlus, setBidPricePlus] = useState(2);
  const [isGesturing, setIsBidding] = useState(false);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [rwlknftIds, setRwlknftIds] = useState<number[]>([]);
  const [contractCstDurations, setContractCstDurations] = useState<CstAuctionDurations | null>(
    null,
  );
  const [contractCstPriceWei, setContractCstPriceWei] = useState<bigint | null>(null);
  const [gestureCstRewardAmountWei, setGestureCstRewardAmountWei] = useState<bigint | null>(null);
  const [isCstRewardLoading, setIsCstRewardLoading] = useState(false);
  const [cstRewardTolerancePercent, setCstRewardTolerancePercent] = useState(1);
  const [acceptAnyCstReward, setAcceptAnyCstReward] = useState(false);
  /**
   * V3 Participation CST split: percentage of the quoted reward minted to the OUTBID
   * participant (default 90); the participant placing the gesture receives the rest.
   * `null` on V2 contracts (no split) — the UI then shows the whole reward as the
   * participant's own, matching V2 behavior.
   */
  const [cstRewardToOutbidBidder, setCstRewardToOutbidBidder] = useState<boolean>(false);

  const cstGestureData = useMemo<CSTGestureData>(() => {
    return mapCTPriceInfo(ctPriceData, contractCstDurations, contractCstPriceWei);
  }, [contractCstDurations, contractCstPriceWei, ctPriceData]);

  const ethGestureInfo = useMemo<EthGestureInfo | null>(() => {
    if (!bidEthPriceData) return null;
    return {
      AuctionDuration: parseInt(bidEthPriceData.AuctionDuration),
      ETHPrice: parseFloat(formatEther(BigInt(bidEthPriceData.ETHPrice))),
      SecondsElapsed: parseInt(bidEthPriceData.SecondsElapsed),
    };
  }, [bidEthPriceData]);

  const gestureCstRewardAmount = useMemo(() => {
    if (gestureCstRewardAmountWei == null) return null;
    const value = Number(formatEther(gestureCstRewardAmountWei));
    return Number.isFinite(value) ? value : null;
  }, [gestureCstRewardAmountWei]);

  const cstRewardToleranceBps = useMemo(() => {
    const clamped = Math.min(100, Math.max(0, cstRewardTolerancePercent));
    return Math.round(clamped * 100);
  }, [cstRewardTolerancePercent]);

  const gestureCstRewardAmountMinLimitWei = useMemo(() => {
    if (acceptAnyCstReward) return 0n;
    if (!gestureCstRewardAmountWei || gestureCstRewardAmountWei <= 0n) return 0n;
    return (gestureCstRewardAmountWei * BigInt(10_000 - cstRewardToleranceBps)) / 10_000n;
  }, [acceptAnyCstReward, gestureCstRewardAmountWei, cstRewardToleranceBps]);

  const gestureCstRewardAmountMin = useMemo(() => {
    const value = Number(formatEther(gestureCstRewardAmountMinLimitWei));
    return Number.isFinite(value) ? value : 0;
  }, [gestureCstRewardAmountMinLimitWei]);

  useEffect(() => {
    if (uxScenario) {
      setContractCstDurations(null);
      setContractCstPriceWei(null);
      setGestureCstRewardAmountWei(100n * 10n ** 18n);
      setIsCstRewardLoading(false);
      return;
    }

    const canReadDurations = !!publicClient && !!contractAddrs.cosmicGame;
    const canReadReward = !!cosmicGameContract;
    const canReadPrice = !!cosmicGameContract;

    if (!canReadDurations) {
      setContractCstDurations(null);
    }
    if (!canReadPrice) {
      setContractCstPriceWei(null);
    }
    if (!canReadReward) {
      setGestureCstRewardAmountWei(null);
      setIsCstRewardLoading(false);
    }
    if (!canReadDurations && !canReadReward && !canReadPrice) {
      return;
    }

    let cancelled = false;
    let inFlight = false;
    let timeoutId: number | null = null;

    // The preview refresh polls continuously, so a transport failure (dev
    // server restart, network blip, machine waking from sleep) would emit one
    // console dump + Sentry event per read per retry. Those failures recover
    // on the next poll; report them at most once per throttle window and keep
    // the last known preview values instead of blanking the form.
    const reportPreviewError = (error: unknown, context: string) => {
      if (isTransientNetworkError(error)) {
        reportErrorThrottled(error, context);
      } else {
        reportError(error, context);
      }
    };

    const refreshLiveCstPreview = async (showLoading = false) => {
      if (cancelled || inFlight) return;
      inFlight = true;
      if (showLoading && canReadReward) setIsCstRewardLoading(true);

      try {
        await Promise.all([
          canReadDurations
            ? publicClient!
                .readContract({
                  address: contractAddrs.cosmicGame as `0x${string}`,
                  abi: cosmicGameAbi,
                  functionName: 'getCstDutchAuctionDurations',
                })
                .then((value) => {
                  if (cancelled || !Array.isArray(value)) return;
                  const [auctionDuration, secondsElapsed] = value;
                  if (typeof auctionDuration !== 'bigint' || typeof secondsElapsed !== 'bigint') {
                    return;
                  }
                  const next = {
                    AuctionDuration: Number(auctionDuration),
                    SecondsElapsed: Number(secondsElapsed),
                    updatedAtMs: Date.now(),
                  };
                  setContractCstDurations((current) => {
                    if (
                      current?.AuctionDuration === next.AuctionDuration &&
                      current?.SecondsElapsed === next.SecondsElapsed
                    ) {
                      return { ...current, updatedAtMs: next.updatedAtMs };
                    }
                    return next;
                  });
                })
                .catch((e) => {
                  if (!cancelled) reportPreviewError(e, 'getCstDutchAuctionDurations');
                })
            : Promise.resolve(),
          canReadPrice
            ? (
                (cosmicGameContract!.read.getNextCstBidPrice?.() as Promise<bigint | undefined>) ??
                Promise.resolve(undefined)
              )
                .then((value) => {
                  if (!cancelled) setContractCstPriceWei(value ?? null);
                })
                .catch((e) => {
                  if (!cancelled) {
                    if (!isTransientNetworkError(e)) setContractCstPriceWei(null);
                    reportPreviewError(e, 'getNextCstBidPrice');
                  }
                })
            : Promise.resolve(),
          canReadReward
            ? readCosmicGameWithFallback<bigint>([
                () =>
                  cosmicGameContract!.read.getBidCstRewardAmount?.() as Promise<bigint | undefined>,
                () =>
                  cosmicGameContract!.read.getBidCstRewardAmountAdvanced?.([0n]) as Promise<
                    bigint | undefined
                  >,
              ])
                .then((value) => {
                  if (!cancelled) setGestureCstRewardAmountWei(value ?? null);
                })
                .catch((e) => {
                  if (!cancelled) {
                    if (!isTransientNetworkError(e)) setGestureCstRewardAmountWei(null);
                    reportPreviewError(e, 'getBidCstRewardAmount');
                  }
                })
            : Promise.resolve(),
        ]);
      } finally {
        inFlight = false;
        if (!cancelled && showLoading) setIsCstRewardLoading(false);
      }
    };

    const scheduleNextRefresh = () => {
      if (cancelled) return;
      timeoutId = window.setTimeout(() => {
        void refreshLiveCstPreview().finally(scheduleNextRefresh);
      }, getLiveCstPreviewRefreshMs());
    };

    const scheduleLiveTimer = shouldScheduleLiveCstPreviewTimer();
    if (scheduleLiveTimer) {
      void refreshLiveCstPreview(true).finally(scheduleNextRefresh);
    } else {
      void refreshLiveCstPreview(true);
    }
    const handleGesturePlaced = () => {
      void refreshLiveCstPreview();
    };
    window.addEventListener('cosmic:gesture-placed', handleGesturePlaced);

    return () => {
      cancelled = true;
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      window.removeEventListener('cosmic:gesture-placed', handleGesturePlaced);
    };
  }, [contractAddrs.cosmicGame, cosmicGameContract, publicClient, uxScenario]);

  // One-shot V3 detection: mainPrizeNumCosmicSignatureNfts() only exists on V3, where the
  // entire per-gesture Participation CST is minted to the outbid previous participant.
  // The selector does not exist on V2, in which case the state stays false and the UI
  // keeps V2 semantics (whole reward to the gesturer).
  useEffect(() => {
    if (uxScenario || !cosmicGameContract) {
      setCstRewardToOutbidBidder(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const value = (await cosmicGameContract.read.mainPrizeNumCosmicSignatureNfts?.()) as
          | bigint
          | undefined;
        if (!cancelled && value !== undefined) {
          setCstRewardToOutbidBidder(true);
        }
      } catch (err) {
        // Expected on V2 deployments (selector absent; behind the proxy this surfaces as a
        // reasonless revert rather than "unrecognized selector"). Anything else is worth reporting.
        if (!cancelled && !isMissingFunctionReadError(err)) {
          reportError(err, 'mainPrizeNumCosmicSignatureNfts');
        }
        if (!cancelled) setCstRewardToOutbidBidder(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cosmicGameContract, uxScenario]);

  const handleTx = async (hashPromise: Promise<`0x${string}`>) => {
    const hash = await hashPromise;
    const receipt = await publicClient!.waitForTransactionReceipt({ hash });
    assertSuccessfulTransactionReceipt(receipt);
    notify('success', t('gesture.confirmed'));
  };

  const isContractAddress = async (address: string) => {
    if (!isAddress(address)) return false;
    try {
      const byteCode = await publicClient!.getCode({ address: address as `0x${string}` });
      return !!byteCode && byteCode !== '0x';
    } catch {
      return false;
    }
  };

  const isERC721 = async (nftAddress: string) => {
    try {
      return await publicClient!.readContract({
        address: nftAddress as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'supportsInterface',
        args: [ERC721_INTERFACE_ID],
      });
    } catch {
      return false;
    }
  };

  const ensureNftOwnership = async (nftAddress: string, tokenId: number) => {
    try {
      const owner = (await publicClient!.readContract({
        address: nftAddress as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'ownerOf',
        args: [BigInt(tokenId)],
      })) as string;
      if (owner?.toLowerCase() !== account?.toLowerCase()) {
        notify('error', t('gesture.validation.notNftOwner'));
        return false;
      }
      return true;
    } catch (err) {
      notifyErrorFromEthers(err);
      return false;
    }
  };

  const ensureNftApprovalForAll = async (nftAddress: string) => {
    const approved = await publicClient!.readContract({
      address: nftAddress as `0x${string}`,
      abi: NFT_ABI,
      functionName: 'isApprovedForAll',
      args: [account as `0x${string}`, contractAddrs.prizesWallet as `0x${string}`],
    });
    if (!approved) {
      const feeParams = await getFeeParams();
      const hash = await writeContract(config, {
        address: nftAddress as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'setApprovalForAll',
        args: [contractAddrs.prizesWallet as `0x${string}`, true],
        account: account!,
        chainId: activeChain.id,
        ...feeParams,
      });
      const receipt = await publicClient!.waitForTransactionReceipt({ hash });
      assertSuccessfulTransactionReceipt(receipt);
    }
  };

  const ensureErc20Allowance = async (
    tokenAddress: string,
    spender: string,
    required: bigint,
    options: { approveMax?: boolean } = {},
  ) => {
    if (required <= 0n) return;
    const allowance = (await publicClient!.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [account as `0x${string}`, spender as `0x${string}`],
    })) as bigint;

    if (allowance >= required) return;
    const approvalAmount = options.approveMax === false ? required : maxUint256;
    const feeParams = await getFeeParams();
    const hash = await writeContract(config, {
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender as `0x${string}`, approvalAmount],
      account: account!,
      chainId: activeChain.id,
      ...feeParams,
    });
    const receipt = await publicClient!.waitForTransactionReceipt({ hash });
    assertSuccessfulTransactionReceipt(receipt);
  };

  const getErc20Decimals = async (tokenAddress: string) => {
    try {
      return (await publicClient!.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals',
      })) as number;
    } catch {
      console.warn('decimals() not found, assuming 18.');
      notify('warning', t('gesture.validation.tokenDecimalsWarning'));
      return 18;
    }
  };

  const hasEthBalance = async (amount: bigint) => {
    try {
      const bal = await publicClient!.getBalance({ address: account as `0x${string}` });
      const ok = bal >= amount;
      return ok;
    } catch (e) {
      reportError(e, 'check ETH balance');
      return false;
    }
  };

  const hasCstBalance = async (amountWei: bigint) => {
    try {
      const bal = await api.get_user_balance(account!);
      if (!bal) return false;
      const wallet = BigInt(bal.CosmicTokenBalance);
      return wallet >= amountWei;
    } catch (e) {
      reportError(e, 'check CST balance');
      return false;
    }
  };

  const getNextEthGestureCostWithModifiers = async () => {
    const base = (await cosmicGameContract!.read.getNextEthBidPrice?.()) as bigint;
    let price = (base * parseEther((100 + gestureCostPlus).toString())) / parseEther('100');
    if (gestureType === 'RandomWalk') {
      price = (price * parseEther('50')) / parseEther('100');
    }
    return price;
  };

  const withNftDonation = async (nftAddress: string, tokenId: number) => {
    if (!nftAddress || nftAddress.trim() === '' || Number.isNaN(tokenId)) {
      throw new Error('Missing attached NFT address or tokenId.');
    }
    if (!(await isContractAddress(nftAddress))) {
      notify('error', t('gesture.validation.invalidContractAddress'));
      return false;
    }
    if (!(await isERC721(nftAddress))) {
      notify('error', t('gesture.validation.notErc721'));
      return false;
    }
    if (!(await ensureNftOwnership(nftAddress, tokenId))) return false;
    await ensureNftApprovalForAll(nftAddress);
    return true;
  };

  const withTokenDonation = async (tokenAddress: string, amountStr: string) => {
    if (!tokenAddress || !amountStr) {
      throw new Error('Missing attached token address or amount.');
    }
    if (!(await isContractAddress(tokenAddress))) {
      notify('error', t('gesture.validation.invalidContractAddress'));
      return { ok: false as const };
    }

    try {
      const ts = await publicClient!.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'totalSupply',
      });
      if (!ts) throw new Error('Not an ERC20');
    } catch {
      notify('error', t('gesture.validation.notErc20'));
      return { ok: false as const };
    }

    const decimals = await getErc20Decimals(tokenAddress);
    const amountWei = parseUnits(amountStr, decimals);
    const bal = (await publicClient!.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [account as `0x${string}`],
    })) as bigint;

    if (bal < amountWei) {
      notify('error', t('gesture.validation.insufficientAttachedToken'));
      return { ok: false as const };
    }
    await ensureErc20Allowance(tokenAddress, contractAddrs.prizesWallet, amountWei);
    return { ok: true as const, amountWei, decimals };
  };

  const estimateDonationGas = async (
    fnName: CosmicGameGestureFunctionName,
    args: readonly unknown[],
    value: bigint,
  ): Promise<bigint> => {
    const estimate = async (callArgs: readonly unknown[]) =>
      publicClient!.estimateContractGas({
        address: contractAddrs.cosmicGame as `0x${string}`,
        abi: pickGestureWriteAbi(fnName, callArgs),
        functionName: fnName,
        args: callArgs as unknown[],
        value,
        account: account as `0x${string}`,
      });

    try {
      return (
        (await withGestureArgsV1ThenV2(fnName, args, estimate, {
          cstRewardAmountMinLimit: gestureCstRewardAmountMinLimitWei,
        })) * 2n
      );
    } catch {
      return GESTURE_GAS_LIMIT;
    }
  };

  /**
   * EIP-1559 fees with floor from current block to avoid "max fee per gas less than block base fee".
   * Uses latest block baseFee * 2 as min to handle block progression and wallet re-estimation.
   */
  const getFeeParams = async (): Promise<{
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
  }> => {
    if (!publicClient) return {};
    try {
      const [block, fees] = await Promise.all([
        publicClient.getBlock({ blockTag: 'latest' }),
        publicClient.estimateFeesPerGas({ chain: activeChain }),
      ]);
      const baseFee = block?.baseFeePerGas ?? 0n;
      const minFromBase = baseFee ? (baseFee * 200n) / 100n : 0n;
      const fromEstimate =
        fees?.maxFeePerGas && fees?.maxPriorityFeePerGas ? (fees.maxFeePerGas * 125n) / 100n : 0n;
      const maxFeePerGas = fromEstimate > minFromBase ? fromEstimate : minFromBase;
      const maxPriorityFeePerGas = fees?.maxPriorityFeePerGas ?? 1_000_000_000n;
      if (maxFeePerGas > 0n) {
        return { maxFeePerGas, maxPriorityFeePerGas };
      }
    } catch {
      /* fallback: no fee override, wallet will supply */
    }
    return {};
  };

  const writeGesture = async (
    functionName: CosmicGameGestureFunctionName,
    args: readonly unknown[],
    signerAddress: `0x${string}`,
    feeParams: Awaited<ReturnType<typeof getFeeParams>>,
    options?: { value?: bigint; gas?: bigint },
  ) =>
    withGestureArgsV1ThenV2(
      functionName,
      args,
      async (callArgs) =>
        writeContract(config, {
          address: contractAddrs.cosmicGame as `0x${string}`,
          abi: pickGestureWriteAbi(functionName, callArgs),
          functionName,
          args: callArgs as unknown[],
          account: signerAddress,
          chainId: activeChain.id,
          ...feeParams,
          ...(options?.value !== undefined ? { value: options.value } : {}),
          ...(options?.gas !== undefined ? { gas: options.gas } : {}),
        }),
      { cstRewardAmountMinLimit: gestureCstRewardAmountMinLimitWei },
    );

  /**
   * Pre-flight guard: refuse to submit a gesture while the round is still inactive
   * (e.g. in the delay window right after a cycle was finalized). Compares against
   * CHAIN time via getDurationUntilRoundActivation() — authoritative even when the
   * UI's cached activation state is stale or the chain clock differs from the wall
   * clock (local Hardhat). Fails open on read errors: the transaction itself is the
   * final authority, so an RPC hiccup must not lock users out of bidding.
   */
  const ensureRoundIsActive = async (): Promise<boolean> => {
    try {
      const duration = (await cosmicGameContract!.read.getDurationUntilRoundActivation?.()) as
        | bigint
        | undefined;
      if (duration !== undefined && duration > 0n) {
        notify(
          'warning',
          t('gesture.validation.cycleNotStarted', {
            duration: formatSeconds(Number(duration), locale),
          }),
        );
        return false;
      }
      return true;
    } catch (err) {
      reportError(err, 'getDurationUntilRoundActivation');
      return true;
    }
  };

  /**
   * Submit an ETH bid (with optional NFT/token donation).
   * Returns `true` on success so the caller can trigger a post-tx refresh.
   */
  const onGesture = async (): Promise<boolean> => {
    setIsBidding(true);
    try {
      if (!account) {
        notify('error', t('wallet.connect'));
        return false;
      }
      if (!(await ensureCorrectChain())) {
        return false;
      }
      if (!cosmicGameContract) {
        notify('error', t('wallet.connectCorrectNetwork'));
        return false;
      }
      if (!(await ensureRoundIsActive())) {
        return false;
      }

      const ethGestureCost = await getNextEthGestureCostWithModifiers();

      if (!(await hasEthBalance(ethGestureCost))) {
        notify('error', t('gesture.validation.insufficientEth'));
        return false;
      }

      const noDonation =
        (contributionType === 'NFT' && (!nftDonateAddress || !nftId)) ||
        (contributionType === 'Token' && (!tokenDonateAddress || !tokenAmount));

      if (noDonation || !contributionType) {
        const signerAddress =
          (client as { account?: { address: `0x${string}` } } | undefined)?.account?.address ??
          (account as `0x${string}`);
        const feeParams = await getFeeParams();
        const hash = await writeGesture('bidWithEth', [rwlkId, message], signerAddress, feeParams, {
          value: ethGestureCost,
          gas: GESTURE_GAS_LIMIT,
        });
        await handleTx(Promise.resolve(hash));
        return true;
      }

      if (contributionType === 'NFT') {
        const nftIdNum = Number(nftId);
        const ok = await withNftDonation(nftDonateAddress!, nftIdNum);
        if (!ok) {
          return false;
        }
        const donateArgs = [rwlkId, message, nftDonateAddress, nftIdNum] as const;
        const gas = await estimateDonationGas('bidWithEthAndDonateNft', donateArgs, ethGestureCost);
        const signerAddress =
          (client as { account?: { address: `0x${string}` } } | undefined)?.account?.address ??
          (account as `0x${string}`);
        const feeParams = await getFeeParams();
        const hash = await writeGesture(
          'bidWithEthAndDonateNft',
          donateArgs,
          signerAddress,
          feeParams,
          { value: ethGestureCost, gas },
        );
        await handleTx(Promise.resolve(hash));
        setNftId('');
        setNftDonateAddress('');
      } else {
        const res = await withTokenDonation(tokenDonateAddress!, tokenAmount!);
        if (!res.ok) {
          return false;
        }
        const donateArgs = [rwlkId, message, tokenDonateAddress, res.amountWei] as const;
        const gas = await estimateDonationGas(
          'bidWithEthAndDonateToken',
          donateArgs,
          ethGestureCost,
        );
        const signerAddress =
          (client as { account?: { address: `0x${string}` } } | undefined)?.account?.address ??
          (account as `0x${string}`);
        const feeParams = await getFeeParams();
        const hash = await writeGesture(
          'bidWithEthAndDonateToken',
          donateArgs,
          signerAddress,
          feeParams,
          { value: ethGestureCost, gas },
        );
        await handleTx(Promise.resolve(hash));
        setTokenAmount('');
        setTokenDonateAddress('');
      }
      return true;
    } catch (err: unknown) {
      if (isUserRejection(err)) {
        notify('info', t('walletTransactionCancelled'));
        return false;
      }
      reportError(err, 'gesture-eth');
      const descriptor = getContractErrorDescriptor(err, ethGestureInfo?.ETHPrice);
      const localizedMessage = descriptor ? t(descriptor.key, descriptor.values) : null;
      const detailed = locale.toLowerCase().startsWith('zh')
        ? null
        : formatCustomContractError(err);
      const combined = [localizedMessage, detailed].filter(Boolean).join('\n\n');
      if (combined) {
        notify('error', combined);
      } else {
        notifyErrorFromEthers(err, t('gesture.transaction.failed'));
      }
      return false;
    } finally {
      setIsBidding(false);
    }
  };

  /**
   * Submit a CST bid (with optional NFT/token donation).
   * Returns `true` on success so the caller can trigger a post-tx refresh.
   */
  const onGestureWithCST = async (): Promise<boolean> => {
    setIsBidding(true);
    let submittedCstPriceMaxLimit: bigint | null = null;
    try {
      if (!account) {
        notify('error', t('wallet.connect'));
        return false;
      }
      if (!(await ensureCorrectChain())) {
        return false;
      }
      let signerClient = client;
      if (!signerClient) {
        // Unpinned: the chain was already aligned by ensureCorrectChain(), and
        // MetaMask's connector chain can lag right after a switch. Pinning `chainId` here
        // would throw `ConnectorChainMismatchError`. We only need the account address.
        signerClient =
          ((await getConnectorClient(config)) as unknown as typeof signerClient) ?? undefined;
      }
      if (!signerClient) {
        notify('error', t('wallet.stillConnecting'));
        return false;
      }
      if (!cosmicGameContract) {
        notify('error', t('wallet.connectCorrectNetwork'));
        return false;
      }
      if (!(await ensureRoundIsActive())) {
        return false;
      }
      const signerAddress =
        (signerClient as { account?: { address: `0x${string}` } } | undefined)?.account?.address ??
        (account as `0x${string}`);

      const quotedCstPrice =
        ((await cosmicGameContract.read.getNextCstBidPrice?.()) as bigint | undefined) ??
        cstGestureData.CSTPriceWei;
      // Apply the user's max-cost tolerance (same knob as ETH gestures). On V2 the CST cost
      // only declines between quote and confirmation, but inside the V3 late-gesture window it
      // rises every second — without headroom the transaction would revert on a stale quote.
      // The contract charges the actual cost; the limit is only a cap.
      const priceMaxLimit =
        (quotedCstPrice * BigInt(Math.round((100 + gestureCostPlus) * 100))) / 10_000n;
      submittedCstPriceMaxLimit = priceMaxLimit;

      if (priceMaxLimit > 0n) {
        if (!(await hasCstBalance(priceMaxLimit))) {
          notify('error', t('gesture.validation.insufficientCst'));
          return false;
        }
        // No ERC-20 approval needed: the game burns the bidder's CST directly via the
        // privileged `CosmicSignatureToken.burn(account, value)` (_onlyGame), which calls
        // `_burn` without touching allowance. An `approve` here would be a pointless extra tx.
      }

      const noDonation =
        (contributionType === 'NFT' && (!nftDonateAddress || !nftId)) ||
        (contributionType === 'Token' && (!tokenDonateAddress || !tokenAmount));

      if (noDonation || !contributionType) {
        const feeParams = await getFeeParams();
        const hash = await writeGesture(
          'bidWithCst',
          [priceMaxLimit, message],
          signerAddress,
          feeParams,
        );
        await handleTx(Promise.resolve(hash));
        return true;
      }

      if (contributionType === 'NFT') {
        const nftIdNum = Number(nftId);
        const ok = await withNftDonation(nftDonateAddress!, nftIdNum);
        if (!ok) return false;
        const feeParams = await getFeeParams();
        const hash = await writeGesture(
          'bidWithCstAndDonateNft',
          [priceMaxLimit, message, nftDonateAddress, nftIdNum],
          signerAddress,
          feeParams,
        );
        await handleTx(Promise.resolve(hash));
        setNftId('');
        setNftDonateAddress('');
      } else {
        const res = await withTokenDonation(tokenDonateAddress!, tokenAmount!);
        if (!res.ok) return false;
        const feeParams = await getFeeParams();
        const hash = await writeGesture(
          'bidWithCstAndDonateToken',
          [priceMaxLimit, message, tokenDonateAddress, res.amountWei],
          signerAddress,
          feeParams,
        );
        await handleTx(Promise.resolve(hash));
        setTokenAmount('');
        setTokenDonateAddress('');
      }
      return true;
    } catch (err: unknown) {
      if (isUserRejection(err)) {
        notify('info', t('walletTransactionCancelled'));
        return false;
      }
      reportError(err, 'gesture-cst');
      const descriptor = getContractErrorDescriptor(err, {
        gestureCurrency: 'CST',
        displayedPriceWei: submittedCstPriceMaxLimit,
      });
      const localizedMessage = descriptor ? t(descriptor.key, descriptor.values) : null;
      const detailed = locale.toLowerCase().startsWith('zh')
        ? null
        : formatCustomContractError(err);
      if (localizedMessage || detailed) {
        notify('error', [localizedMessage, detailed].filter(Boolean).join('\n\n'));
      } else if (isContractRevertError(err)) {
        notify('error', t('gesture.transaction.cstReverted'));
      } else {
        notifyErrorFromEthers(err, t('gesture.transaction.failed'));
      }
      return false;
    } finally {
      setIsBidding(false);
    }
  };

  useEffect(() => {
    if (!nftRWLKContract || !account || !usedRWLKData) return;
    const gesturedRWLKIds = usedRWLKData.map((x) => x.RWalkTokenId);
    let cancelled = false;
    (nftRWLKContract.read.walletOfOwner?.([account]) as Promise<readonly bigint[]>)
      .then((tokens) => {
        if (cancelled) return;
        const nftIds = tokens
          .map((t) => Number(t))
          .filter((t: number) => !gesturedRWLKIds.includes(t))
          .reverse();
        setRwlknftIds(nftIds);
      })
      .catch((e) => {
        if (cancelled) return;
        reportError(e, 'getRwlkNFTIds');
      });
    return () => {
      cancelled = true;
    };
  }, [nftRWLKContract, account, usedRWLKData]);

  const updateCstRewardTolerancePercent = useCallback((value: number) => {
    if (!Number.isFinite(value)) return;
    setCstRewardTolerancePercent(Math.min(100, Math.max(0, value)));
  }, []);

  return {
    gestureType,
    setBidType,
    contributionType,
    setContributionType,
    cstGestureData,
    ethGestureInfo,
    gestureCstRewardAmount,
    gestureCstRewardAmountMin,
    gestureCstRewardAmountMinLimitWei,
    isCstRewardLoading,
    cstRewardToOutbidBidder,
    cstRewardTolerancePercent,
    setCstRewardTolerancePercent: updateCstRewardTolerancePercent,
    acceptAnyCstReward,
    setAcceptAnyCstReward,
    message,
    setMessage,
    nftDonateAddress,
    setNftDonateAddress,
    nftId,
    setNftId,
    tokenDonateAddress,
    setTokenDonateAddress,
    tokenAmount,
    setTokenAmount,
    rwlkId,
    setRwlkId,
    gestureCostPlus,
    setBidPricePlus,
    isGesturing,
    advancedExpanded,
    setAdvancedExpanded,
    rwlknftIds,
    onGesture,
    onGestureWithCST,
  } as const;
}
