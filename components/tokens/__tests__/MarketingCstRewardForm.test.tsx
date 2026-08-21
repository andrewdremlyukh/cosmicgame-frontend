import { toast } from 'sonner';

import {
  TEST_APP_CONTRACT_ADDRESSES,
  TEST_MARKETING_WALLET,
} from '@/test-utils/contractAddressesFixture';

import { fireEvent, renderWithQuery, screen, waitFor } from '@/test-utils';

import { MarketingCstRewardForm } from '../MarketingCstRewardForm';

const OWNER = '0x1111111111111111111111111111111111111111';
const TREASURER = '0x2222222222222222222222222222222222222222';
const OTHER_ACCOUNT = '0x3333333333333333333333333333333333333333';
const RECIPIENT = '0x4444444444444444444444444444444444444444';
const TX_HASH = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const mockWriteContract = jest.fn();
const mockReadContract = jest.fn();
const mockWaitForTransactionReceipt = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockReportError = jest.fn();

let mockAccount = TREASURER;
let mockActive = true;
let mockContractAddresses = TEST_APP_CONTRACT_ADDRESSES;

jest.mock('@wagmi/core', () => ({
  writeContract: (...args: unknown[]) => mockWriteContract(...args),
}));

jest.mock('wagmi', () => ({
  useConfig: () => ({ id: 'test-config' }),
  usePublicClient: () => ({
    readContract: (...args: unknown[]) => mockReadContract(...args),
    waitForTransactionReceipt: (...args: unknown[]) => mockWaitForTransactionReceipt(...args),
  }),
}));

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: (...args: unknown[]) => mockInvalidateQueries(...args),
    }),
  };
});

jest.mock('../../../contexts/ContractAddressesContext', () => ({
  useContractAddresses: () => mockContractAddresses,
}));

jest.mock('../../../hooks/web3', () => ({
  useActiveWeb3React: () => ({
    account: mockAccount,
    active: mockActive,
  }),
}));

const mockEnsureCorrectChain = jest.fn<Promise<boolean>, []>();
jest.mock('../../../hooks/useRequireChain', () => ({
  useRequireChain: () => ({
    requiredChainId: 421614,
    connectedChainId: 421614,
    isWrongChain: false,
    isConnected: true,
    switchToRequiredChain: jest.fn(),
    ensureCorrectChain: mockEnsureCorrectChain,
  }),
}));

jest.mock('../../../utils/errors', () => {
  const actual = jest.requireActual('../../../utils/errors');
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
    warning: jest.fn(),
  },
}));

function setupReadContracts(balance = 3000n * 10n ** 18n) {
  mockReadContract.mockImplementation(({ functionName }: { functionName: string }) => {
    if (functionName === 'decimals') return Promise.resolve(18);
    if (functionName === 'balanceOf') return Promise.resolve(balance);
    return Promise.resolve(null);
  });
}

async function renderReadyForm(props: Partial<Parameters<typeof MarketingCstRewardForm>[0]> = {}) {
  renderWithQuery(
    <MarketingCstRewardForm
      marketingWalletAddress={TEST_MARKETING_WALLET}
      ownerAddress={OWNER}
      treasurerAddress={TREASURER}
      historyHref={`/cosmic-token-transfer/${TEST_MARKETING_WALLET}`}
      {...props}
    />,
  );
  await screen.findByText('3000.00 CST');
}

function fillRewardForm(amount = '12.5', recipient = RECIPIENT) {
  fireEvent.change(screen.getByLabelText('Recipient address'), {
    target: { value: recipient },
  });
  fireEvent.change(screen.getByLabelText('Amount'), {
    target: { value: amount },
  });
}

function submitRewardForm() {
  const button = screen.getByRole('button', {
    name: 'toasts.transfer.marketingCst.pay',
  });
  const form = button.closest('form');
  expect(form).not.toBeNull();
  fireEvent.submit(form!);
}

describe('MarketingCstRewardForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnsureCorrectChain.mockResolvedValue(true);
    mockAccount = TREASURER;
    mockActive = true;
    mockContractAddresses = TEST_APP_CONTRACT_ADDRESSES;
    setupReadContracts();
    mockWriteContract.mockResolvedValue(TX_HASH);
    mockWaitForTransactionReceipt.mockResolvedValue({ status: 'success' });
    mockInvalidateQueries.mockResolvedValue(undefined);
  });

  it('renders outreach reserve balance, owner, treasurer, and history link', async () => {
    await renderReadyForm();

    expect(screen.getByText('0x888888....888888')).toBeInTheDocument();
    expect(screen.getByText('3000.00 CST')).toBeInTheDocument();
    expect(screen.getByText('0x111111....111111')).toBeInTheDocument();
    expect(screen.getByText('0x222222....222222')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'toasts.transfer.marketingCst.pay' }),
    ).toHaveTextContent('toasts.transfer.marketingCst.pay');
    expect(screen.getByRole('link', { name: /view outreach reserve transfers/i })).toHaveAttribute(
      'href',
      `/cosmic-token-transfer/${TEST_MARKETING_WALLET}`,
    );
  });

  it('shows the localized balance loading state', async () => {
    mockReadContract.mockReturnValue(new Promise(() => {}));

    renderWithQuery(
      <MarketingCstRewardForm
        marketingWalletAddress={TEST_MARKETING_WALLET}
        ownerAddress={OWNER}
        treasurerAddress={TREASURER}
      />,
    );

    expect(await screen.findByText('toasts.transfer.marketingCst.loading')).toBeInTheDocument();
  });

  it('rejects invalid recipient, invalid amount, and over-balance amount before writing', async () => {
    await renderReadyForm();
    fillRewardForm('1', 'not-an-address');
    submitRewardForm();
    expect(toast.error).toHaveBeenCalledWith('toasts.transfer.common.invalidRecipient');

    jest.clearAllMocks();
    fillRewardForm('abc');
    submitRewardForm();
    expect(toast.error).toHaveBeenCalledWith('toasts.transfer.common.invalidAmount');

    jest.clearAllMocks();
    fillRewardForm('3000.01');
    submitRewardForm();
    expect(toast.error).toHaveBeenCalledWith('toasts.transfer.marketingCst.insufficientBalance');
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('does not sign anything when the wallet is on the wrong chain', async () => {
    mockEnsureCorrectChain.mockResolvedValue(false);
    await renderReadyForm();
    fillRewardForm('12.5');

    submitRewardForm();

    await waitFor(() => expect(mockEnsureCorrectChain).toHaveBeenCalled());
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('requires the connected wallet to be the current treasurer', async () => {
    mockAccount = OTHER_ACCOUNT;
    await renderReadyForm();
    fillRewardForm('1');

    submitRewardForm();

    expect(toast.error).toHaveBeenCalledWith('toasts.transfer.marketingCst.treasurerRequired');
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('disables submit when the treasurer address is unavailable', async () => {
    await renderReadyForm({ treasurerAddress: null });

    expect(screen.getByRole('button', { name: 'toasts.transfer.marketingCst.pay' })).toBeDisabled();
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('falls back to 18 decimals when token decimals cannot be read', async () => {
    mockReadContract.mockImplementation(({ functionName }: { functionName: string }) => {
      if (functionName === 'decimals') return Promise.reject(new Error('decimals failed'));
      if (functionName === 'balanceOf') return Promise.resolve(3000n * 10n ** 18n);
      return Promise.resolve(null);
    });

    await renderReadyForm();
    fillRewardForm('1.5');
    submitRewardForm();

    await waitFor(() =>
      expect(toast.warning).toHaveBeenCalledWith('toasts.transfer.marketingCst.decimalsWarning'),
    );
    await waitFor(() => expect(mockWriteContract).toHaveBeenCalled());
    expect(mockReportError).toHaveBeenCalledWith(
      expect.any(Error),
      'MarketingWallet CST decimals read',
    );
  });

  it('shows a balance error and disables submit when reserve balance cannot be read', async () => {
    mockReadContract.mockImplementation(({ functionName }: { functionName: string }) => {
      if (functionName === 'decimals') return Promise.resolve(18);
      if (functionName === 'balanceOf') return Promise.reject(new Error('balance failed'));
      return Promise.resolve(null);
    });

    renderWithQuery(
      <MarketingCstRewardForm
        marketingWalletAddress={TEST_MARKETING_WALLET}
        ownerAddress={OWNER}
        treasurerAddress={TREASURER}
      />,
    );

    expect(
      await screen.findByText('toasts.transfer.marketingCst.balanceReadFailed'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'toasts.transfer.marketingCst.pay' })).toBeDisabled();
  });

  it('calls MarketingWallet payReward, waits for receipt, and invalidates related queries', async () => {
    await renderReadyForm();
    fillRewardForm('12.5');

    submitRewardForm();

    await waitFor(() => expect(mockWriteContract).toHaveBeenCalledTimes(1));
    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'test-config' }),
      expect.objectContaining({
        address: TEST_MARKETING_WALLET,
        functionName: 'payReward',
        args: [RECIPIENT, 12500000000000000000n],
        account: TREASURER,
        chainId: 421614,
      }),
    );
    expect(mockWriteContract).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ functionName: 'transfer' }),
    );
    expect(mockWaitForTransactionReceipt).toHaveBeenCalledWith({ hash: TX_HASH });

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('toasts.transfer.marketingCst.confirmed'),
    );
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['userBalance', TEST_MARKETING_WALLET],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['userBalance', RECIPIENT] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['ctTransfers', TEST_MARKETING_WALLET],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['ctTransfers', RECIPIENT] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['ctBalancesDistribution'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['dashboardInfo'] });
    expect(screen.getByText('toasts.transfer.marketingCst.confirmed')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'toasts.transfer.marketingCst.viewTransaction' }),
    ).toHaveAttribute('href', expect.stringContaining(TX_HASH));
  });

  it('shows an informational toast when the wallet rejects the reward transaction', async () => {
    mockWriteContract.mockRejectedValue({ code: 4001 });
    await renderReadyForm();
    fillRewardForm('1');

    submitRewardForm();

    await waitFor(() =>
      expect(toast.info).toHaveBeenCalledWith('toasts.walletTransactionCancelled'),
    );
    expect(mockWaitForTransactionReceipt).not.toHaveBeenCalled();
  });

  it('reports and displays MarketingWallet write failures', async () => {
    const err = new Error('payReward failed');
    mockWriteContract.mockRejectedValue(err);
    await renderReadyForm();
    fillRewardForm('1');

    submitRewardForm();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('toasts.transfer.marketingCst.failed'),
    );
    expect(mockReportError).toHaveBeenCalledWith(err, 'MarketingWallet payReward');
  });

  it('reports a reverted receipt and shows the localized reward fallback', async () => {
    mockWaitForTransactionReceipt.mockResolvedValueOnce({ status: 'reverted' });
    await renderReadyForm();
    fillRewardForm('1');

    submitRewardForm();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('toasts.transfer.marketingCst.failed'),
    );
    expect(mockReportError).toHaveBeenCalledWith(expect.any(Error), 'MarketingWallet payReward');
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('shows the localized pending label while the reward transaction is awaiting approval', async () => {
    let resolveWrite!: (hash: string) => void;
    mockWriteContract.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveWrite = resolve;
      }),
    );
    await renderReadyForm();
    fillRewardForm('1');

    submitRewardForm();
    expect(await screen.findByText('toasts.transfer.marketingCst.paying')).toBeInTheDocument();

    resolveWrite(TX_HASH);
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('toasts.transfer.marketingCst.confirmed'),
    );
  });
});
