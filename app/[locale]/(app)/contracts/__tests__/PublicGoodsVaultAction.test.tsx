import { toast } from 'sonner';

import { fireEvent, renderWithQuery, screen, waitFor } from '@/test-utils';

import { PublicGoodsVaultAction } from '../components/PublicGoodsVaultAction';

const mockWriteContract = jest.fn();
const mockWaitForTransactionReceipt = jest.fn();
const mockUseActiveWeb3React = jest.fn();
const mockReportError = jest.fn();

jest.mock('@wagmi/core', () => ({
  writeContract: (...args: unknown[]) => mockWriteContract(...args),
}));

jest.mock('wagmi', () => ({
  useConfig: () => ({ id: 'test-config' }),
  usePublicClient: () => ({
    waitForTransactionReceipt: (...args: unknown[]) => mockWaitForTransactionReceipt(...args),
  }),
}));

jest.mock('../../../../../hooks/web3', () => ({
  useActiveWeb3React: () => mockUseActiveWeb3React(),
}));

const mockEnsureCorrectChain = jest.fn<Promise<boolean>, []>();
jest.mock('../../../../../hooks/useRequireChain', () => ({
  useRequireChain: () => ({
    requiredChainId: 421614,
    connectedChainId: 421614,
    isWrongChain: false,
    isConnected: true,
    switchToRequiredChain: jest.fn(),
    ensureCorrectChain: mockEnsureCorrectChain,
  }),
}));

jest.mock('../../../../../utils/errors', () => {
  const actual = jest.requireActual('../../../../../utils/errors');
  return {
    ...actual,
    reportError: (...args: unknown[]) => mockReportError(...args),
  };
});

jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
  },
}));

describe('PublicGoodsVaultAction', () => {
  const defaultProps = {
    vaultAddress: '0x96bB0ADB414d5350f435E52f94946B6C7A0760a9',
    beneficiaryAddress: '0x1234567890123456789012345678901234567890',
    vaultBalanceEth: 0.5,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockEnsureCorrectChain.mockResolvedValue(true);
    mockWriteContract.mockResolvedValue('0xhash');
    mockWaitForTransactionReceipt.mockResolvedValue({ status: 'success' });
    mockUseActiveWeb3React.mockReturnValue({
      account: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      active: true,
      chainId: 42161,
    });
  });

  it('renders the current vault balance and action button', () => {
    renderWithQuery(<PublicGoodsVaultAction {...defaultProps} />);

    expect(screen.getByText('Public Goods Vault Action')).toBeInTheDocument();
    expect(screen.getByText('0.5000 ETH')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Forward Public Goods Vault balance to Protocol Guild' }),
    ).toBeEnabled();
  });

  it('disables forwarding when the vault has no funds', () => {
    renderWithQuery(<PublicGoodsVaultAction {...defaultProps} vaultBalanceEth={0} />);

    expect(screen.getByRole('button', { name: /forward public goods vault/i })).toBeDisabled();
    expect(screen.getByText('toasts.contribution.publicGoodsVault.nothing')).toBeInTheDocument();
  });

  it('calls the no-argument send overload and waits for confirmation', async () => {
    renderWithQuery(<PublicGoodsVaultAction {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /forward public goods vault/i }));

    await waitFor(() => {
      expect(mockWriteContract).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'test-config' }),
        expect.objectContaining({
          address: defaultProps.vaultAddress,
          functionName: 'send',
          args: [],
        }),
      );
    });
    expect(mockWaitForTransactionReceipt).toHaveBeenCalledWith({ hash: '0xhash' });
    expect(toast.success).toHaveBeenCalledWith('toasts.contribution.publicGoodsVault.forwarded');
  });

  it('does not sign anything when the wallet is on the wrong chain', async () => {
    mockEnsureCorrectChain.mockResolvedValue(false);
    renderWithQuery(<PublicGoodsVaultAction {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /forward public goods vault/i }));

    await waitFor(() => expect(mockEnsureCorrectChain).toHaveBeenCalled());
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('shows informational cancellation for wallet rejection code 4001', async () => {
    mockWriteContract.mockRejectedValueOnce({ code: 4001 });
    renderWithQuery(<PublicGoodsVaultAction {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /forward public goods vault/i }));

    await waitFor(() =>
      expect(toast.info).toHaveBeenCalledWith('toasts.walletTransactionCancelled'),
    );
    expect(mockReportError).not.toHaveBeenCalled();
  });

  it('reports RPC failures with the localized vault fallback', async () => {
    const error = new Error('RPC unavailable');
    mockWriteContract.mockRejectedValueOnce(error);
    renderWithQuery(<PublicGoodsVaultAction {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /forward public goods vault/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('toasts.contribution.publicGoodsVault.failed'),
    );
    expect(mockReportError).toHaveBeenCalledWith(error, 'forward public goods vault funds');
  });

  it('treats a reverted receipt as an error instead of success', async () => {
    mockWaitForTransactionReceipt.mockResolvedValueOnce({ status: 'reverted' });
    renderWithQuery(<PublicGoodsVaultAction {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /forward public goods vault/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('toasts.contribution.publicGoodsVault.failed'),
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('shows the localized pending label while forwarding funds', async () => {
    let resolveWrite!: (hash: string) => void;
    mockWriteContract.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveWrite = resolve;
      }),
    );
    renderWithQuery(<PublicGoodsVaultAction {...defaultProps} />);

    fireEvent.click(screen.getByRole('button', { name: /forward public goods vault/i }));
    expect(
      await screen.findByText('toasts.contribution.publicGoodsVault.forwarding'),
    ).toBeInTheDocument();

    resolveWrite('0xhash');
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('toasts.contribution.publicGoodsVault.forwarded'),
    );
  });
});
