import { renderHook, act } from '@testing-library/react';

const APP_CHAIN_ID = 421614;
const OTHER_CHAIN_ID = 42161;

const mockNotify = jest.fn();
jest.mock('../useNotify', () => ({
  useNotify: () => ({ notify: mockNotify, notifyErrorFromEthers: jest.fn() }),
}));

const mockAccount = jest.fn<{ isConnected: boolean; chainId?: number }, []>();
const mockSwitchChainAsync = jest.fn<Promise<unknown>, [{ chainId: number }]>();
const mockConnectorClient = jest.fn<{ data: unknown }, []>();
const mockWalletClient = jest.fn<{ data: unknown }, []>();

jest.mock('wagmi', () => ({
  useAccount: () => mockAccount(),
  useConfig: () => ({}),
  useSwitchChain: () => ({ switchChainAsync: mockSwitchChainAsync }),
  useConnectorClient: () => mockConnectorClient(),
  useWalletClient: () => mockWalletClient(),
}));

const mockGetConnectorClient = jest.fn<Promise<unknown>, [unknown]>();
jest.mock('@wagmi/core', () => ({
  getConnectorClient: (...args: unknown[]) => mockGetConnectorClient(args[0]),
}));

const mockGetChainId = jest.fn<Promise<number>, [unknown]>();
jest.mock('viem/actions', () => ({
  getChainId: (...args: unknown[]) => mockGetChainId(args[0]),
}));

import { useRequireChain } from '../useRequireChain';

const SIGNER = { id: 'signer' };

beforeEach(() => {
  jest.clearAllMocks();
  mockAccount.mockReturnValue({ isConnected: true, chainId: APP_CHAIN_ID });
  mockConnectorClient.mockReturnValue({ data: SIGNER });
  mockWalletClient.mockReturnValue({ data: undefined });
  mockGetConnectorClient.mockResolvedValue(SIGNER);
  mockGetChainId.mockResolvedValue(APP_CHAIN_ID);
  mockSwitchChainAsync.mockResolvedValue(undefined);
});

describe('useRequireChain — wallet already on the app chain', () => {
  it('reports the right chain and does not flag a mismatch', () => {
    const { result } = renderHook(() => useRequireChain());

    expect(result.current.requiredChainId).toBe(APP_CHAIN_ID);
    expect(result.current.connectedChainId).toBe(APP_CHAIN_ID);
    expect(result.current.isWrongChain).toBe(false);
    expect(result.current.isConnected).toBe(true);
  });

  it('lets a write through without asking the wallet to switch', async () => {
    const { result } = renderHook(() => useRequireChain());

    let allowed: boolean | undefined;
    await act(async () => {
      allowed = await result.current.ensureCorrectChain();
    });

    expect(allowed).toBe(true);
    expect(mockSwitchChainAsync).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
  });

  // Regression: an unreadable chain id used to fall back to the wallet's cached
  // value (or the app chain outright), which silently let the write through.
  it('requests a switch instead of assuming the app chain when the id is unreadable', async () => {
    mockGetChainId.mockRejectedValueOnce(new Error('transport down'));
    const { result } = renderHook(() => useRequireChain());

    let allowed: boolean | undefined;
    await act(async () => {
      allowed = await result.current.ensureCorrectChain();
    });

    expect(mockSwitchChainAsync).toHaveBeenCalledWith({ chainId: APP_CHAIN_ID });
    expect(allowed).toBe(true);
  });

  it('treats switchToRequiredChain as a no-op', async () => {
    const { result } = renderHook(() => useRequireChain());

    let switched: boolean | undefined;
    await act(async () => {
      switched = await result.current.switchToRequiredChain();
    });

    expect(switched).toBe(true);
    expect(mockSwitchChainAsync).not.toHaveBeenCalled();
  });
});

describe('useRequireChain — wallet on the wrong chain', () => {
  beforeEach(() => {
    mockAccount.mockReturnValue({ isConnected: true, chainId: OTHER_CHAIN_ID });
    mockGetChainId.mockResolvedValue(OTHER_CHAIN_ID);
  });

  it('flags the mismatch instead of reporting the configured chain', () => {
    const { result } = renderHook(() => useRequireChain());

    expect(result.current.isWrongChain).toBe(true);
    expect(result.current.connectedChainId).toBe(OTHER_CHAIN_ID);
    expect(result.current.connectedChainId).not.toBe(result.current.requiredChainId);
  });

  it('asks the wallet to switch and allows the write once it succeeds', async () => {
    const { result } = renderHook(() => useRequireChain());

    let allowed: boolean | undefined;
    await act(async () => {
      allowed = await result.current.ensureCorrectChain();
    });

    expect(mockSwitchChainAsync).toHaveBeenCalledWith({ chainId: APP_CHAIN_ID });
    expect(allowed).toBe(true);
  });

  it('blocks the write and surfaces a message when the switch fails', async () => {
    mockSwitchChainAsync.mockRejectedValueOnce(new Error('switch unsupported'));
    const { result } = renderHook(() => useRequireChain());

    let allowed: boolean | undefined;
    await act(async () => {
      allowed = await result.current.ensureCorrectChain();
    });

    expect(allowed).toBe(false);
    expect(mockNotify).toHaveBeenCalledWith('error', 'toasts.network.wrongChain');
  });

  it('uses the caller-supplied failure copy when provided', async () => {
    mockSwitchChainAsync.mockRejectedValueOnce(new Error('switch unsupported'));
    const { result } = renderHook(() =>
      useRequireChain({ switchFailedMessage: 'switch before your gesture' }),
    );

    await act(async () => {
      await result.current.ensureCorrectChain();
    });

    expect(mockNotify).toHaveBeenCalledWith('error', 'switch before your gesture');
  });

  it('treats a rejected switch prompt as informational, not an error', async () => {
    mockSwitchChainAsync.mockRejectedValueOnce({ code: 4001, message: 'User rejected' });
    const { result } = renderHook(() => useRequireChain());

    let allowed: boolean | undefined;
    await act(async () => {
      allowed = await result.current.ensureCorrectChain();
    });

    expect(allowed).toBe(false);
    expect(mockNotify).toHaveBeenCalledWith('info', 'toasts.walletTransactionCancelled');
  });

  it('detects a mismatch the wallet reports even when wagmi state looks correct', async () => {
    // wagmi thinks we are on the app chain; the wallet client disagrees.
    mockAccount.mockReturnValue({ isConnected: true, chainId: APP_CHAIN_ID });
    mockGetChainId.mockResolvedValue(OTHER_CHAIN_ID);
    const { result } = renderHook(() => useRequireChain());

    expect(result.current.isWrongChain).toBe(false);

    await act(async () => {
      await result.current.ensureCorrectChain();
    });

    expect(mockSwitchChainAsync).toHaveBeenCalledWith({ chainId: APP_CHAIN_ID });
  });

  it('switches on an explicit user action', async () => {
    const { result } = renderHook(() => useRequireChain());

    let switched: boolean | undefined;
    await act(async () => {
      switched = await result.current.switchToRequiredChain();
    });

    expect(switched).toBe(true);
    expect(mockSwitchChainAsync).toHaveBeenCalledWith({ chainId: APP_CHAIN_ID });
  });

  it('does not switch networks during render', () => {
    renderHook(() => useRequireChain());
    expect(mockSwitchChainAsync).not.toHaveBeenCalled();
    expect(mockGetChainId).not.toHaveBeenCalled();
  });
});

describe('useRequireChain — no wallet connected', () => {
  beforeEach(() => {
    mockAccount.mockReturnValue({ isConnected: false, chainId: undefined });
    mockConnectorClient.mockReturnValue({ data: undefined });
    mockWalletClient.mockReturnValue({ data: undefined });
    mockGetConnectorClient.mockRejectedValue(new Error('no connector'));
  });

  it('does not claim a wrong chain when there is nothing connected', () => {
    const { result } = renderHook(() => useRequireChain());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.isWrongChain).toBe(false);
    expect(result.current.connectedChainId).toBeNull();
  });

  it('blocks the write with the wallet-not-ready message', async () => {
    const { result } = renderHook(() => useRequireChain());

    let allowed: boolean | undefined;
    await act(async () => {
      allowed = await result.current.ensureCorrectChain();
    });

    expect(allowed).toBe(false);
    expect(mockSwitchChainAsync).not.toHaveBeenCalled();
    expect(mockNotify).toHaveBeenCalledWith('error', 'toasts.wallet.notReady');
  });

  it('asks the user to connect rather than switching', async () => {
    const { result } = renderHook(() => useRequireChain());

    let switched: boolean | undefined;
    await act(async () => {
      switched = await result.current.switchToRequiredChain();
    });

    expect(switched).toBe(false);
    expect(mockNotify).toHaveBeenCalledWith('error', 'toasts.wallet.connect');
    expect(mockSwitchChainAsync).not.toHaveBeenCalled();
  });

  it('falls back to the imperative connector client when the hooks have none yet', async () => {
    mockAccount.mockReturnValue({ isConnected: true, chainId: APP_CHAIN_ID });
    mockGetConnectorClient.mockResolvedValue(SIGNER);
    mockGetChainId.mockResolvedValue(APP_CHAIN_ID);
    const { result } = renderHook(() => useRequireChain());

    let allowed: boolean | undefined;
    await act(async () => {
      allowed = await result.current.ensureCorrectChain();
    });

    expect(mockGetConnectorClient).toHaveBeenCalled();
    expect(allowed).toBe(true);
  });

  it('falls back to the wagmi chain id when the wallet refuses to report one', async () => {
    mockAccount.mockReturnValue({ isConnected: true, chainId: OTHER_CHAIN_ID });
    mockConnectorClient.mockReturnValue({ data: SIGNER });
    mockGetChainId.mockRejectedValue(new Error('unsupported method'));
    const { result } = renderHook(() => useRequireChain());

    await act(async () => {
      await result.current.ensureCorrectChain();
    });

    expect(mockSwitchChainAsync).toHaveBeenCalledWith({ chainId: APP_CHAIN_ID });
  });
});
