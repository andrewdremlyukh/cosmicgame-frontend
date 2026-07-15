import { renderHook, act, waitFor } from '@testing-library/react';
import { writeContract as wagmiWriteContract } from '@wagmi/core';

import { useGestureForm } from '../useGestureForm';
import useCosmicGameContract from '../../hooks/useCosmicGameContract';
import api from '../../services/api';
import { resetUxScenarioForTest } from '../../lib/uxCycleScenarios';

jest.mock('@wagmi/core', () => ({
  getConnectorClient: jest.fn().mockResolvedValue(undefined),
  writeContract: jest.fn().mockResolvedValue('0xhash'),
}));

const mockWagmiWriteContract = wagmiWriteContract as jest.MockedFunction<typeof wagmiWriteContract>;

interface LiveCstPreviewTestGlobals {
  __COSMIC_ENABLE_LIVE_CST_PREVIEW_TEST_TIMERS__?: boolean;
  __COSMIC_LIVE_CST_PREVIEW_TEST_INTERVAL_MS__?: number;
}

/* ────────────────────────────────────────────────────────────────── */
/*  Notification                                                     */
/* ────────────────────────────────────────────────────────────────── */

const mockNotify = jest.fn();
const mockNotifyErrorFromEthers = jest.fn();

jest.mock('../../hooks/useNotify', () => ({
  useNotify: () => ({ notify: mockNotify, notifyErrorFromEthers: mockNotifyErrorFromEthers }),
}));

/* ────────────────────────────────────────────────────────────────── */
/*  Web3                                                             */
/* ────────────────────────────────────────────────────────────────── */

jest.mock('../../hooks/web3', () => ({
  useActiveWeb3React: jest.fn().mockReturnValue({ account: '0xUser', chainId: 1, active: true }),
}));

/* ────────────────────────────────────────────────────────────────── */
/*  Wagmi – extracted so individual tests can override behaviour     */
/* ────────────────────────────────────────────────────────────────── */

const mockWaitForTransactionReceipt = jest.fn().mockResolvedValue({ status: 'success' });
const mockGetCode = jest.fn().mockResolvedValue('0x1234');
const mockGetBalance = jest.fn().mockResolvedValue(BigInt(10e18));
const mockReadContract = jest.fn().mockResolvedValue(true);
const mockEstimateContractGas = jest.fn().mockResolvedValue(BigInt(500_000));
const mockWriteContract = jest.fn().mockResolvedValue('0xhash');
const mockSwitchChainAsync = jest.fn().mockResolvedValue(undefined);
const mockWalletGetChainId = jest.fn().mockResolvedValue(421614);
const mockGetSignerChainId = jest.fn().mockResolvedValue(421614);

jest.mock('wagmi', () => ({
  useConfig: jest.fn(() => ({})),
  useChainId: jest.fn(() => 421614),
  useAccount: jest.fn(() => ({ address: '0xUser', isConnected: true, chainId: 421614 })),
  useSwitchChain: jest.fn(() => ({ switchChainAsync: mockSwitchChainAsync })),
  useConnectorClient: jest.fn(() => ({ data: undefined })),
  usePublicClient: jest.fn(() => ({
    waitForTransactionReceipt: mockWaitForTransactionReceipt,
    getCode: mockGetCode,
    getBalance: mockGetBalance,
    readContract: mockReadContract,
    estimateContractGas: mockEstimateContractGas,
  })),
  useWalletClient: jest.fn(() => ({
    data: {
      writeContract: mockWriteContract,
      account: { address: '0xUser' as `0x${string}` },
      /** Must match jest `activeChain.id` for `NEXT_PUBLIC_NETWORK` in jest.setup (sepolia → 421614). */
      getChainId: mockWalletGetChainId,
    },
  })),
}));

jest.mock('viem/actions', () => ({
  getChainId: (...args: unknown[]) => mockGetSignerChainId(...args),
}));

/* ────────────────────────────────────────────────────────────────── */
/*  CosmicGame contract                                              */
/* ────────────────────────────────────────────────────────────────── */

const mockGestureWithEth = jest.fn().mockResolvedValue('0xhash');
const mockGestureWithCst = jest.fn().mockResolvedValue('0xhash');
const mockGestureWithEthAndContributeNft = jest.fn().mockResolvedValue('0xhash');
const mockGestureWithCstAndContributeNft = jest.fn().mockResolvedValue('0xhash');
const mockGestureWithEthAndContributeToken = jest.fn().mockResolvedValue('0xhash');
const mockGestureWithCstAndContributeToken = jest.fn().mockResolvedValue('0xhash');
const mockGetNextEthGestureCost = jest.fn().mockResolvedValue(BigInt(1e16));
const mockGetNextCstGestureCost = jest.fn().mockResolvedValue(BigInt('1000000000000000000'));
const mockGetGestureCstRewardAmount = jest.fn().mockResolvedValue(BigInt('100000000000000000000'));
const mockGetGestureCstRewardAmountAdvanced = jest
  .fn()
  .mockResolvedValue(BigInt('100000000000000000000'));

const mockContractObj = {
  read: {
    getNextEthBidPrice: mockGetNextEthGestureCost,
    getNextCstBidPrice: mockGetNextCstGestureCost,
    getBidCstRewardAmount: mockGetGestureCstRewardAmount,
    getBidCstRewardAmountAdvanced: mockGetGestureCstRewardAmountAdvanced,
  },
  write: {
    bidWithEth: mockGestureWithEth,
    bidWithCst: mockGestureWithCst,
    bidWithEthAndDonateNft: mockGestureWithEthAndContributeNft,
    bidWithCstAndDonateNft: mockGestureWithCstAndContributeNft,
    bidWithEthAndDonateToken: mockGestureWithEthAndContributeToken,
    bidWithCstAndDonateToken: mockGestureWithCstAndContributeToken,
  },
};

jest.mock('../../hooks/useCosmicGameContract', () => ({
  __esModule: true,
  default: jest.fn(() => mockContractObj),
}));

/* ────────────────────────────────────────────────────────────────── */
/*  RWLK NFT contract                                                */
/* ────────────────────────────────────────────────────────────────── */

const mockRWLKContract = {
  read: {
    walletOfOwner: jest.fn().mockResolvedValue([BigInt(1), BigInt(2), BigInt(3)]),
  },
};

jest.mock('../../hooks/useRWLKNFTContract', () => ({
  __esModule: true,
  default: jest.fn(() => mockRWLKContract),
}));

/* ────────────────────────────────────────────────────────────────── */
/*  useApiQuery                                                      */
/* ────────────────────────────────────────────────────────────────── */

const mockUseCTPrice = jest.fn().mockReturnValue({
  data: {
    AuctionDuration: '3600',
    CSTPrice: '1000000000000000000',
    SecondsElapsed: '1800',
  },
});
const mockUseGestureEthCost = jest.fn().mockReturnValue({
  data: {
    AuctionDuration: '3600',
    ETHPrice: '10000000000000000',
    SecondsElapsed: '1800',
  },
});
const mockUseUsedRWLKNFTs = jest.fn().mockReturnValue({
  data: [{ RWalkTokenId: 2 }],
});

jest.mock('../../hooks/useApiQuery', () => ({
  useCTPrice: (...args: unknown[]) => mockUseCTPrice(...args),
  useGestureEthCost: (...args: unknown[]) => mockUseGestureEthCost(...args),
  useUsedRWLKNFTs: (...args: unknown[]) => mockUseUsedRWLKNFTs(...args),
}));

/* ────────────────────────────────────────────────────────────────── */
/*  API                                                              */
/* ────────────────────────────────────────────────────────────────── */

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get_user_balance: jest.fn().mockResolvedValue({
      CosmicTokenBalance: '1000000000000000000000',
    }),
  },
}));

/* ────────────────────────────────────────────────────────────────── */
/*  viem                                                             */
/* ────────────────────────────────────────────────────────────────── */

jest.mock('viem', () => ({
  ...jest.requireActual('../../__mocks__/viem'),
  formatEther: jest.fn((v: bigint) => (Number(v) / 1e18).toString()),
  isAddress: jest.fn().mockReturnValue(true),
  parseEther: jest.fn((v: string) => BigInt(Math.round(Number(v) * 1e18))),
  parseUnits: jest.fn((v: string, d: number) => BigInt(Math.round(Number(v) * 10 ** d))),
  maxUint256: BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'),
}));

/* ────────────────────────────────────────────────────────────────── */
/*  Config & utilities                                               */
/* ────────────────────────────────────────────────────────────────── */

jest.mock('../../contexts/ContractAddressesContext', () => ({
  useContractAddresses: () => ({
    randomWalkNft: '0x0',
    cosmicGame: '0xCosmicGame',
    cosmicSignature: '0x0',
    cosmicToken: '0x0',
    cosmicDao: '0x0',
    charity: '0x0',
    prizesWallet: '0xRaffle',
    stakingCst: '0x0',
    stakingRwalk: '0x0',
    marketing: '0x0',
    implementation: '0x0',
  }),
}));

jest.mock('../../config/networks', () => ({
  networkConfig: {
    rpcUrl: 'http://127.0.0.1:8545',
    chainId: 421614,
    apiUrl: 'http://test-api.example/api/cosmicgame/',
    nftApiUrl: 'https://nfts-sepolia.cosmicsignature.com/',
  },
}));

jest.mock('../../config/constants', () => ({
  ERC721_INTERFACE_ID: '0x80ac58cd',
  GESTURE_GAS_LIMIT: BigInt(30000000),
}));

jest.mock('../../contracts/abis', () => ({
  randomWalkNftAbi: [],
  cosmicTokenAbi: [],
  cosmicGameAbi: [],
}));

const mockIsUserRejection = jest.fn().mockReturnValue(false);
const mockReportError = jest.fn();
const mockGetContractErrorDescriptor = jest.fn().mockReturnValue(null);
const mockIsContractRevertError = jest.fn().mockReturnValue(false);
const mockFormatCustomContractError = jest.fn().mockReturnValue(null);

jest.mock('../../utils/errors', () => ({
  isUserRejection: (...args: unknown[]) => mockIsUserRejection(...args),
  reportError: (...args: unknown[]) => mockReportError(...args),
}));

jest.mock('../../utils/contractErrors', () => ({
  getContractErrorDescriptor: (...args: unknown[]) => mockGetContractErrorDescriptor(...args),
  isContractRevertError: (...args: unknown[]) => mockIsContractRevertError(...args),
  formatCustomContractError: (...args: unknown[]) => mockFormatCustomContractError(...args),
}));

/* ────────────────────────────────────────────────────────────────── */
/*  Typed references for per-test overrides                          */
/* ────────────────────────────────────────────────────────────────── */

const mockUseCosmicGameContract = useCosmicGameContract as jest.Mock;
const mockApiGetUserBalance = api.get_user_balance as jest.Mock;

const MAX_UINT256 = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff');

/* ────────────────────────────────────────────────────────────────── */
/*  Setup / Teardown                                                 */
/* ────────────────────────────────────────────────────────────────── */

beforeEach(() => {
  jest.clearAllMocks();
  process.env.NEXT_PUBLIC_UX_SCENARIO = '';
  const liveCstGlobals = globalThis as LiveCstPreviewTestGlobals;
  liveCstGlobals.__COSMIC_ENABLE_LIVE_CST_PREVIEW_TEST_TIMERS__ = false;
  liveCstGlobals.__COSMIC_LIVE_CST_PREVIEW_TEST_INTERVAL_MS__ = undefined;
  window.history.pushState({}, '', '/');
  resetUxScenarioForTest();
  mockWagmiWriteContract.mockResolvedValue('0xhash' as `0x${string}`);

  mockGestureWithEth.mockResolvedValue('0xhash');
  mockGestureWithCst.mockResolvedValue('0xhash');
  mockGestureWithEthAndContributeNft.mockResolvedValue('0xhash');
  mockGestureWithEthAndContributeToken.mockResolvedValue('0xhash');
  mockGestureWithCstAndContributeNft.mockResolvedValue('0xhash');
  mockGestureWithCstAndContributeToken.mockResolvedValue('0xhash');
  mockGetNextEthGestureCost.mockResolvedValue(BigInt(1e16));
  mockGetNextCstGestureCost.mockResolvedValue(BigInt('1000000000000000000'));
  mockGetGestureCstRewardAmount.mockResolvedValue(BigInt('100000000000000000000'));
  mockGetGestureCstRewardAmountAdvanced.mockResolvedValue(BigInt('100000000000000000000'));
  mockGetBalance.mockResolvedValue(BigInt(10e18));
  mockGetCode.mockResolvedValue('0x1234');
  mockReadContract.mockImplementation(async ({ functionName }: { functionName: string }) => {
    if (functionName === 'allowance') return MAX_UINT256;
    return true;
  });
  mockWriteContract.mockResolvedValue('0xhash');
  mockSwitchChainAsync.mockResolvedValue(undefined);
  mockWalletGetChainId.mockResolvedValue(421614);
  mockGetSignerChainId.mockResolvedValue(421614);
  mockWaitForTransactionReceipt.mockResolvedValue({ status: 'success' });
  mockIsUserRejection.mockReturnValue(false);
  mockIsContractRevertError.mockReturnValue(false);
  mockGetContractErrorDescriptor.mockReturnValue(null);
  mockFormatCustomContractError.mockReturnValue(null);
  mockEstimateContractGas.mockResolvedValue(BigInt(500_000));
  mockUseCosmicGameContract.mockReturnValue(mockContractObj);
  mockApiGetUserBalance.mockResolvedValue({
    CosmicTokenBalance: '1000000000000000000000',
  });

  mockRWLKContract.read.walletOfOwner.mockResolvedValue([BigInt(1), BigInt(2), BigInt(3)]);

  mockUseCTPrice.mockReturnValue({
    data: {
      AuctionDuration: '3600',
      CSTPrice: '1000000000000000000',
      SecondsElapsed: '1800',
    },
  });
  mockUseGestureEthCost.mockReturnValue({
    data: {
      AuctionDuration: '3600',
      ETHPrice: '10000000000000000',
      SecondsElapsed: '1800',
    },
  });
  mockUseUsedRWLKNFTs.mockReturnValue({
    data: [{ RWalkTokenId: 2 }],
  });

  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  resetUxScenarioForTest();
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const flushAsyncWork = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
};

/* ────────────────────────────────────────────────────────────────── */
/*  Tests                                                            */
/* ────────────────────────────────────────────────────────────────── */

describe('useGestureForm', () => {
  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useGestureForm());

    expect(result.current.gestureType).toBe('ETH');
    expect(result.current.contributionType).toBe('NFT');
    expect(result.current.message).toBe('');
    expect(result.current.nftDonateAddress).toBe('');
    expect(result.current.nftId).toBe('');
    expect(result.current.tokenDonateAddress).toBe('');
    expect(result.current.tokenAmount).toBe('');
    expect(result.current.rwlkId).toBe(-1);
    expect(result.current.gestureCostPlus).toBe(2);
    expect(result.current.isGesturing).toBe(false);
    expect(result.current.advancedExpanded).toBe(false);
    expect(result.current.rwlknftIds).toEqual([]);
    expect(result.current.cstGestureData).toMatchObject({
      AuctionDuration: 3600,
      CSTPrice: 1,
      SecondsElapsed: 1800,
      CSTPriceWei: BigInt('1000000000000000000'),
      isFree: false,
      source: 'api',
    });
    expect(result.current.ethGestureInfo).toEqual({
      AuctionDuration: 3600,
      ETHPrice: 0.01,
      SecondsElapsed: 1800,
    });
  });

  it('derives cstGestureData from useCTPrice query', () => {
    const { result } = renderHook(() => useGestureForm());

    expect(result.current.cstGestureData).toMatchObject({
      AuctionDuration: 3600,
      CSTPrice: 1,
      SecondsElapsed: 1800,
      isFree: false,
    });
  });

  it('derives ethGestureInfo from useGestureEthCost query', () => {
    const { result } = renderHook(() => useGestureForm());

    expect(result.current.ethGestureInfo).toEqual({
      AuctionDuration: 3600,
      ETHPrice: 0.01,
      SecondsElapsed: 1800,
    });
  });

  it('returns empty cstGestureData when useCTPrice returns no data', () => {
    mockUseCTPrice.mockReturnValue({ data: undefined });
    const { result } = renderHook(() => useGestureForm());

    expect(result.current.cstGestureData).toMatchObject({
      AuctionDuration: 0,
      CSTPrice: 0,
      SecondsElapsed: 0,
      CSTPriceWei: 0n,
      isFree: false,
      source: 'empty',
    });
  });

  it('derives dynamic CST duration from contract read when available', async () => {
    mockReadContract.mockImplementation(async ({ functionName }: { functionName: string }) => {
      if (functionName === 'getCstDutchAuctionDurations') return [43200n, 1200n];
      return true;
    });

    const { result } = renderHook(() => useGestureForm());
    await waitFor(() => expect(result.current.cstGestureData.source).toBe('contract'));

    expect(result.current.cstGestureData).toMatchObject({
      AuctionDuration: 43200,
      SecondsElapsed: 1200,
      CSTPrice: 1,
      CSTPriceWei: BigInt('1000000000000000000'),
      source: 'contract',
      apiAuctionDuration: 3600,
      apiSecondsElapsed: 1800,
    });
  });

  it('uses live contract CST price when it differs from the API fallback', async () => {
    mockGetNextCstGestureCost.mockResolvedValue(BigInt('2500000000000000000'));
    mockReadContract.mockImplementation(async ({ functionName }: { functionName: string }) => {
      if (functionName === 'getCstDutchAuctionDurations') return [5400n, 2700n];
      return true;
    });

    const { result } = renderHook(() => useGestureForm());
    await waitFor(() => expect(result.current.cstGestureData.CSTPrice).toBe(2.5));

    expect(result.current.cstGestureData).toMatchObject({
      AuctionDuration: 5400,
      SecondsElapsed: 2700,
      CSTPriceWei: BigInt('2500000000000000000'),
      source: 'contract',
      apiAuctionDuration: 3600,
      apiSecondsElapsed: 1800,
    });
  });

  it('refreshes live CST reward and duration data on an interval', async () => {
    const liveCstGlobals = globalThis as LiveCstPreviewTestGlobals;
    liveCstGlobals.__COSMIC_ENABLE_LIVE_CST_PREVIEW_TEST_TIMERS__ = true;
    liveCstGlobals.__COSMIC_LIVE_CST_PREVIEW_TEST_INTERVAL_MS__ = 50;
    const rewardValues = [BigInt('100000000000000000000'), BigInt('125000000000000000000')];
    const priceValues = [BigInt('1000000000000000000'), BigInt('2000000000000000000')];
    const durationValues = [
      [43200n, 1200n],
      [43200n, 1201n],
    ];

    let rewardReadCount = 0;
    let priceReadCount = 0;
    let durationReadCount = 0;
    mockGetNextCstGestureCost.mockImplementation(
      async () => priceValues[Math.min(priceReadCount++, priceValues.length - 1)]!,
    );
    mockGetGestureCstRewardAmount.mockImplementation(
      async () => rewardValues[Math.min(rewardReadCount++, rewardValues.length - 1)]!,
    );
    mockReadContract.mockImplementation(async ({ functionName }: { functionName: string }) => {
      if (functionName === 'getCstDutchAuctionDurations') {
        return durationValues[Math.min(durationReadCount++, durationValues.length - 1)]!;
      }
      if (functionName === 'allowance') return MAX_UINT256;
      return true;
    });

    const { result } = renderHook(() => useGestureForm());
    await waitFor(() => expect(result.current.gestureCstRewardAmount).toBe(125));

    expect(mockGetGestureCstRewardAmount.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(mockGetNextCstGestureCost.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(result.current.gestureCstRewardAmount).toBe(125);
    expect(result.current.gestureCstRewardAmountMin).toBe(123.75);
    expect(result.current.cstGestureData.SecondsElapsed).toBe(1201);
    expect(result.current.cstGestureData.CSTPrice).toBe(2);
  });

  it('refreshes the CST preview immediately when a gesture event lands', async () => {
    let liveReward = BigInt('100000000000000000000');
    mockGetGestureCstRewardAmount.mockImplementation(async () => liveReward);

    const { result } = renderHook(() => useGestureForm());
    await waitFor(() => expect(result.current.gestureCstRewardAmount).toBe(100));
    await flushAsyncWork();

    expect(result.current.gestureCstRewardAmount).toBe(100);

    liveReward = BigInt('110000000000000000000');
    act(() => {
      window.dispatchEvent(new CustomEvent('cosmic:gesture-placed'));
    });
    await waitFor(() => expect(result.current.gestureCstRewardAmount).toBe(110));

    expect(result.current.gestureCstRewardAmount).toBe(110);
  });

  it('skips overlapping live CST preview refreshes', async () => {
    const liveCstGlobals = globalThis as LiveCstPreviewTestGlobals;
    liveCstGlobals.__COSMIC_ENABLE_LIVE_CST_PREVIEW_TEST_TIMERS__ = true;
    liveCstGlobals.__COSMIC_LIVE_CST_PREVIEW_TEST_INTERVAL_MS__ = 10;
    let resolveReward!: (value: bigint) => void;
    mockGetGestureCstRewardAmount.mockImplementation(
      () =>
        new Promise<bigint>((resolve) => {
          resolveReward = resolve;
        }),
    );

    const { result } = renderHook(() => useGestureForm());
    await waitFor(() => expect(mockGetGestureCstRewardAmount).toHaveBeenCalled());
    const callsWhilePending = mockGetGestureCstRewardAmount.mock.calls.length;

    await new Promise((resolve) => window.setTimeout(resolve, 35));

    expect(mockGetGestureCstRewardAmount.mock.calls.length).toBeLessThanOrEqual(
      callsWhilePending + 1,
    );

    await act(async () => {
      resolveReward(BigInt('100000000000000000000'));
      await flushAsyncWork();
    });

    expect(result.current.gestureCstRewardAmount).toBe(100);
  });

  it('falls back to getBidCstRewardAmountAdvanced when the primary reward selector is unavailable', async () => {
    mockGetGestureCstRewardAmount.mockRejectedValue(
      new Error('function selector was not recognized'),
    );
    mockGetGestureCstRewardAmountAdvanced.mockResolvedValue(BigInt('80000000000000000000'));

    const { result } = renderHook(() => useGestureForm());
    await waitFor(() => expect(result.current.gestureCstRewardAmount).toBe(80));

    expect(mockGetGestureCstRewardAmountAdvanced).toHaveBeenCalledWith([0n]);
    expect(result.current.gestureCstRewardAmount).toBe(80);
    expect(result.current.gestureCstRewardAmountMin).toBe(79.2);
  });

  it('cleans up the CST preview timer and gesture event listener on unmount', async () => {
    (globalThis as LiveCstPreviewTestGlobals).__COSMIC_ENABLE_LIVE_CST_PREVIEW_TEST_TIMERS__ = true;
    const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'cosmic:gesture-placed',
      expect.any(Function),
    );
  });

  it('treats zero CST price as free even before elapsed duration crosses threshold', () => {
    mockUseCTPrice.mockReturnValue({
      data: {
        AuctionDuration: '43200',
        CSTPrice: '0',
        SecondsElapsed: '1200',
      },
    });
    const { result } = renderHook(() => useGestureForm());

    expect(result.current.cstGestureData).toMatchObject({
      AuctionDuration: 43200,
      CSTPrice: 0,
      SecondsElapsed: 1200,
      isFree: true,
    });
  });

  it('keeps local UX scenarios aligned with normal gesture form defaults', async () => {
    process.env.NEXT_PUBLIC_UX_SCENARIO = 'live-low-time';
    resetUxScenarioForTest();

    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    expect(result.current.gestureType).toBe('ETH');
    expect(result.current.advancedExpanded).toBe(false);
    expect(result.current.gestureCstRewardAmount).toBe(100);
    expect(mockGetGestureCstRewardAmount).not.toHaveBeenCalled();

    expect(mockGetGestureCstRewardAmount).not.toHaveBeenCalled();
  });

  it('returns null ethGestureInfo when useGestureEthCost returns no data', () => {
    mockUseGestureEthCost.mockReturnValue({ data: undefined });
    const { result } = renderHook(() => useGestureForm());

    expect(result.current.ethGestureInfo).toBeNull();
  });

  it('filters RWLK NFTs using useUsedRWLKNFTs data', async () => {
    const { result } = renderHook(() => useGestureForm());

    // The useEffect runs asynchronously using usedRWLKData from the query hook
    await waitFor(() => expect(result.current.rwlknftIds).toEqual([3, 1]));

    // Wallet owns [1,2,3]; token 2 is already used → available [1,3] reversed → [3,1]
    expect(result.current.rwlknftIds).toEqual([3, 1]);
  });

  it('ignores a walletOfOwner read that resolves after unmount', async () => {
    let resolveTokens!: (tokens: bigint[]) => void;
    mockRWLKContract.read.walletOfOwner.mockReturnValueOnce(
      new Promise<bigint[]>((resolve) => {
        resolveTokens = resolve;
      }),
    );

    const { result, unmount } = renderHook(() => useGestureForm());
    await flushAsyncWork();
    expect(result.current.rwlknftIds).toEqual([]);

    unmount();

    await act(async () => {
      resolveTokens([BigInt(7), BigInt(8)]);
      await flushAsyncWork();
    });

    // Nothing to assert on state after unmount; the contract is that the late
    // resolution neither throws nor reports, which jest.setup would surface as
    // a failing console.error.
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('does not report a walletOfOwner rejection that lands after unmount', async () => {
    let rejectTokens!: (err: Error) => void;
    mockRWLKContract.read.walletOfOwner.mockReturnValueOnce(
      new Promise<bigint[]>((_resolve, reject) => {
        rejectTokens = reject;
      }),
    );

    const { unmount } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    unmount();

    await act(async () => {
      rejectTokens(new Error('wallet disconnected'));
      await flushAsyncWork();
    });

    expect(mockReportError).not.toHaveBeenCalledWith(expect.anything(), 'getRwlkNFTIds');
  });

  it('still reports a walletOfOwner rejection while mounted', async () => {
    const readError = new Error('rpc down');
    mockRWLKContract.read.walletOfOwner.mockRejectedValueOnce(readError);

    renderHook(() => useGestureForm());
    await flushAsyncWork();

    expect(mockReportError).toHaveBeenCalledWith(readError, 'getRwlkNFTIds');
  });

  it('onGesture succeeds with ETH gesture and returns true', async () => {
    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    let success!: boolean;
    success = await result.current.onGesture();
    await flushAsyncWork();

    expect(success).toBe(true);
    expect(mockWagmiWriteContract).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ functionName: 'bidWithEth' }),
    );
    expect(mockWaitForTransactionReceipt).toHaveBeenCalled();
    expect(mockNotify).toHaveBeenCalledWith('success', 'toasts.gesture.confirmed');
    expect(result.current.isGesturing).toBe(false);
  });

  it('onGesture succeeds with NFT contribution', async () => {
    mockReadContract.mockImplementation(async ({ functionName }: { functionName: string }) => {
      if (functionName === 'ownerOf') return '0xUser';
      return true;
    });

    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    act(() => {
      result.current.setNftDonateAddress('0xNftContract');
      result.current.setNftId('42');
    });

    let success!: boolean;
    success = await result.current.onGesture();
    await flushAsyncWork();

    expect(success).toBe(true);
    expect(mockWagmiWriteContract).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ functionName: 'bidWithEthAndDonateNft' }),
    );
    await waitFor(() => expect(result.current.nftDonateAddress).toBe(''));
    expect(result.current.nftId).toBe('');
  });

  it('onGesture succeeds with token contribution', async () => {
    mockReadContract.mockImplementation(async ({ functionName }: { functionName: string }) => {
      if (functionName === 'decimals') return 18;
      if (functionName === 'balanceOf') return BigInt(1000e18);
      if (functionName === 'allowance') return MAX_UINT256;
      return true;
    });

    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    act(() => {
      result.current.setContributionType('Token');
      result.current.setTokenDonateAddress('0xTokenContract');
      result.current.setTokenAmount('10');
    });

    let success!: boolean;
    success = await result.current.onGesture();
    await flushAsyncWork();

    expect(success).toBe(true);
    expect(mockWagmiWriteContract).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ functionName: 'bidWithEthAndDonateToken' }),
    );
    await waitFor(() => expect(result.current.tokenDonateAddress).toBe(''));
    expect(result.current.tokenAmount).toBe('');
  });

  it('onGestureWithCST succeeds and returns true', async () => {
    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    expect(result.current.cstGestureData.CSTPrice).toBe(1);

    let success!: boolean;
    success = await result.current.onGestureWithCST();
    await flushAsyncWork();

    expect(success).toBe(true);
    expect(mockWagmiWriteContract).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ functionName: 'bidWithCst' }),
    );
    expect(mockApiGetUserBalance).toHaveBeenCalled();
    expect(result.current.isGesturing).toBe(false);
  });

  it('passes selected minimum CST reward to V2 CST gesture writes', async () => {
    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    act(() => {
      result.current.setCstRewardTolerancePercent(5);
    });

    await result.current.onGestureWithCST();
    await flushAsyncWork();

    expect(mockWagmiWriteContract).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        functionName: 'bidWithCst',
        // priceMaxLimit carries the default 2% max-cost headroom over the 1 CST quote, so a
        // cost rising between quote and confirmation (V3 late-gesture premium) does not revert.
        args: [BigInt('1020000000000000000'), '', BigInt('95000000000000000000')],
      }),
    );
  });

  it('submits zero minimum CST reward when accepting any reward', async () => {
    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    act(() => {
      result.current.setAcceptAnyCstReward(true);
    });

    await result.current.onGestureWithCST();
    await flushAsyncWork();

    expect(result.current.gestureCstRewardAmountMinLimitWei).toBe(0n);
    expect(mockWagmiWriteContract).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        functionName: 'bidWithCst',
        // Quote + default 2% max-cost headroom (see the previous test).
        args: [BigInt('1020000000000000000'), '', 0n],
      }),
    );
  });

  it('onGestureWithCST handles free gesture when window closed', async () => {
    mockUseCTPrice.mockReturnValue({ data: undefined });
    mockGetNextCstGestureCost.mockResolvedValue(0n);
    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    expect(result.current.cstGestureData.CSTPrice).toBe(0);

    let success!: boolean;
    success = await result.current.onGestureWithCST();
    await flushAsyncWork();

    expect(success).toBe(true);
    expect(mockWagmiWriteContract).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ functionName: 'bidWithCst' }),
    );
    expect(mockApiGetUserBalance).not.toHaveBeenCalled();
  });

  it('onGesture notifies on insufficient ETH balance', async () => {
    mockGetBalance.mockResolvedValue(BigInt(0));

    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    let success!: boolean;
    success = await result.current.onGesture();
    await flushAsyncWork();

    expect(success).toBe(false);
    expect(mockNotify).toHaveBeenCalledWith('error', 'toasts.gesture.validation.insufficientEth');
    expect(mockWagmiWriteContract).not.toHaveBeenCalled();
  });

  it('onGestureWithCST notifies on insufficient CST balance', async () => {
    mockApiGetUserBalance.mockResolvedValue({ CosmicTokenBalance: '0' });

    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    expect(result.current.cstGestureData.CSTPrice).toBe(1);

    let success!: boolean;
    success = await result.current.onGestureWithCST();
    await flushAsyncWork();

    expect(success).toBe(false);
    expect(mockNotify).toHaveBeenCalledWith('error', 'toasts.gesture.validation.insufficientCst');
    expect(mockGestureWithCst).not.toHaveBeenCalled();
  });

  it('onGesture notifies when no contract available', async () => {
    mockUseCosmicGameContract.mockReturnValue(null);

    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    let success!: boolean;
    success = await result.current.onGesture();
    await flushAsyncWork();

    expect(success).toBe(false);
    expect(mockNotify).toHaveBeenCalledWith('error', 'toasts.wallet.connectCorrectNetwork');
  });

  it('onGesture silently ignores user rejection', async () => {
    const rejectionError = { code: 4001, message: 'User rejected' };
    mockWagmiWriteContract.mockRejectedValueOnce(rejectionError);
    mockIsUserRejection.mockReturnValue(true);

    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    let success!: boolean;
    success = await result.current.onGesture();
    await flushAsyncWork();

    expect(success).toBe(false);
    expect(mockNotify).toHaveBeenCalledWith('info', 'toasts.walletTransactionCancelled');
    expect(mockNotifyErrorFromEthers).not.toHaveBeenCalled();
    expect(result.current.isGesturing).toBe(false);
  });

  it('resets isGesturing after gesture completion', async () => {
    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    expect(result.current.isGesturing).toBe(false);

    await result.current.onGesture();
    await flushAsyncWork();

    expect(result.current.isGesturing).toBe(false);
  });

  /* ────────────────────────────────────────────────────────────────
   *  Error-boundary + blockchain-interaction edge cases
   * ──────────────────────────────────────────────────────────────── */

  it('onGesture without connected account notifies error', async () => {
    const useWeb3 = jest.requireMock('../../hooks/web3');
    useWeb3.useActiveWeb3React.mockReturnValue({ account: null, chainId: 1, active: false });

    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    let ok: boolean | undefined;
    ok = await result.current.onGesture();
    await flushAsyncWork();

    expect(ok).toBe(false);
    expect(mockNotify).toHaveBeenCalledWith('error', 'toasts.wallet.connect');
    expect(mockWagmiWriteContract).not.toHaveBeenCalled();
    // Restore
    useWeb3.useActiveWeb3React.mockReturnValue({ account: '0xUser', chainId: 1, active: true });
  });

  it('uses a generic localized app-network message when switching fails', async () => {
    mockGetSignerChainId.mockResolvedValueOnce(1);
    mockSwitchChainAsync.mockRejectedValueOnce(new Error('switch failed'));

    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    const ok = await result.current.onGesture();

    expect(ok).toBe(false);
    expect(mockSwitchChainAsync).toHaveBeenCalledWith({ chainId: 421614 });
    expect(mockNotify).toHaveBeenCalledWith('error', 'toasts.network.switchForGesture');
  });

  it('onGesture reports error with context "gesture-eth" and falls back to notifyErrorFromEthers', async () => {
    const rpcErr = new Error('rpc timeout');
    mockWagmiWriteContract.mockRejectedValueOnce(rpcErr);
    mockGetContractErrorDescriptor.mockReturnValue(null);
    mockIsUserRejection.mockReturnValue(false);

    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    await result.current.onGesture();
    await flushAsyncWork();

    expect(mockReportError).toHaveBeenCalledWith(rpcErr, 'gesture-eth');
    expect(mockNotifyErrorFromEthers).toHaveBeenCalledWith(
      rpcErr,
      'toasts.gesture.transaction.failed',
    );
  });

  it('onGesture selects the localized descriptor key for a known contract revert', async () => {
    const revertErr = new Error('execution reverted');
    mockWagmiWriteContract.mockRejectedValueOnce(revertErr);
    mockGetContractErrorDescriptor.mockReturnValueOnce({
      key: 'gesture.contractErrors.insufficientReceivedBidAmount',
      errorName: 'InsufficientReceivedBidAmount',
    });
    mockIsUserRejection.mockReturnValue(false);

    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    let ok: boolean | undefined;
    ok = await result.current.onGesture();
    await flushAsyncWork();

    expect(ok).toBe(false);
    expect(mockNotify).toHaveBeenCalledWith(
      'error',
      'toasts.gesture.contractErrors.insufficientReceivedBidAmount',
    );
    expect(mockNotifyErrorFromEthers).not.toHaveBeenCalled();
    mockGetContractErrorDescriptor.mockReturnValue(null);
  });

  it('onGestureWithCST reports error with context "gesture-cst"', async () => {
    const cstErr = new Error('cst revert');
    mockWagmiWriteContract.mockRejectedValueOnce(cstErr);
    mockGetContractErrorDescriptor.mockReturnValue(null);
    mockIsUserRejection.mockReturnValue(false);

    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    await result.current.onGestureWithCST();
    await flushAsyncWork();

    expect(mockReportError).toHaveBeenCalledWith(cstErr, 'gesture-cst');
  });

  it('explains CST protection reverts when no specific contract message is decoded', async () => {
    const cstErr = new Error('execution reverted');
    mockWagmiWriteContract.mockRejectedValueOnce(cstErr);
    mockGetContractErrorDescriptor.mockReturnValue(null);
    mockIsContractRevertError.mockReturnValue(true);

    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    await result.current.onGestureWithCST();
    await flushAsyncWork();

    expect(mockNotify).toHaveBeenCalledWith('error', 'toasts.gesture.transaction.cstReverted');
    expect(mockNotifyErrorFromEthers).not.toHaveBeenCalled();
  });

  it('onGesture awaits transaction receipt after writeContract returns a hash', async () => {
    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    await result.current.onGesture();
    await flushAsyncWork();

    expect(mockWaitForTransactionReceipt).toHaveBeenCalledWith({ hash: '0xhash' });
  });

  it('treats a reverted receipt as a localized transaction failure', async () => {
    mockWaitForTransactionReceipt.mockResolvedValueOnce({ status: 'reverted' });
    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();

    const ok = await result.current.onGesture();
    await flushAsyncWork();

    expect(ok).toBe(false);
    expect(mockReportError).toHaveBeenCalledWith(expect.any(Error), 'gesture-eth');
    expect(mockNotifyErrorFromEthers).toHaveBeenCalledWith(
      expect.any(Error),
      'toasts.gesture.transaction.failed',
    );
    expect(mockNotify).not.toHaveBeenCalledWith('success', 'toasts.gesture.confirmed');
  });

  it('onGesture aborts if ensureNftOwnership reports wrong owner', async () => {
    mockReadContract.mockImplementation(async (args: { functionName: string }) => {
      if (args.functionName === 'supportsInterface') return true;
      if (args.functionName === 'ownerOf') return '0xOtherOwner';
      return true;
    });

    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();
    act(() => {
      result.current.setContributionType('NFT');
      result.current.setNftDonateAddress('0xNft');
      result.current.setNftId('1');
    });

    let ok: boolean | undefined;
    ok = await result.current.onGesture();
    await flushAsyncWork();

    expect(ok).toBe(false);
    expect(mockNotify).toHaveBeenCalledWith('error', 'toasts.gesture.validation.notNftOwner');
    mockReadContract.mockResolvedValue(true);
  });

  it('onGesture with non-ERC721 attached NFT aborts with error', async () => {
    mockReadContract.mockImplementation(async (args: { functionName: string }) => {
      if (args.functionName === 'supportsInterface') return false;
      return true;
    });

    const { result } = renderHook(() => useGestureForm());
    await flushAsyncWork();
    act(() => {
      result.current.setContributionType('NFT');
      result.current.setNftDonateAddress('0xNft');
      result.current.setNftId('1');
    });

    let ok: boolean | undefined;
    ok = await result.current.onGesture();
    await flushAsyncWork();

    expect(ok).toBe(false);
    expect(mockNotify).toHaveBeenCalledWith('error', 'toasts.gesture.validation.notErc721');
    mockReadContract.mockResolvedValue(true);
  });
});
