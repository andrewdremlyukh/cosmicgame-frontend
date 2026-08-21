import { toast } from 'sonner';

import { TEST_APP_CONTRACT_ADDRESSES } from '@/test-utils/contractAddressesFixture';

import { fireEvent, renderWithQuery, screen, waitFor } from '@/test-utils';

import { CstTransferForm } from '../CstTransferForm';

const SOURCE = '0x1111111111111111111111111111111111111111';
const OTHER_SOURCE = '0x2222222222222222222222222222222222222222';
const RECIPIENT = '0x3333333333333333333333333333333333333333';
const TX_HASH = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

const mockWriteContract = jest.fn();
const mockReadContract = jest.fn();
const mockWaitForTransactionReceipt = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockReportError = jest.fn();

let mockAccount = SOURCE;
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

function setupReadContracts(balance = 100n * 10n ** 18n) {
  mockReadContract.mockImplementation(({ functionName }: { functionName: string }) => {
    if (functionName === 'decimals') return Promise.resolve(18);
    if (functionName === 'balanceOf') return Promise.resolve(balance);
    return Promise.resolve(null);
  });
}

async function renderReadyForm(sourceAddress = SOURCE) {
  renderWithQuery(
    <CstTransferForm
      sourceAddress={sourceAddress}
      sourceLabel="Test source"
      historyHref={`/cosmic-token-transfer/${sourceAddress}`}
    />,
  );
  await screen.findByText('100.00 CST');
}

function fillTransferForm(amount = '12.5', recipient = RECIPIENT) {
  fireEvent.change(screen.getByLabelText('myPages.transferCst.form.recipientAddress'), {
    target: { value: recipient },
  });
  fireEvent.change(screen.getByLabelText('myPages.transferCst.form.amount'), {
    target: { value: amount },
  });
}

function submitTransferForm() {
  const button = screen.getByRole('button', { name: 'myPages.transferCst.form.sendAria' });
  const form = button.closest('form');
  expect(form).not.toBeNull();
  fireEvent.submit(form!);
}

describe('CstTransferForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnsureCorrectChain.mockResolvedValue(true);
    mockAccount = SOURCE;
    mockActive = true;
    mockContractAddresses = TEST_APP_CONTRACT_ADDRESSES;
    setupReadContracts();
    mockWriteContract.mockResolvedValue(TX_HASH);
    mockWaitForTransactionReceipt.mockResolvedValue({ status: 'success' });
    mockInvalidateQueries.mockResolvedValue(undefined);
  });

  it('renders source wallet, balance, and transfer history link', async () => {
    await renderReadyForm();

    expect(screen.getByText('Test source')).toBeInTheDocument();
    expect(screen.getByText('0x111111....111111')).toBeInTheDocument();
    expect(screen.getByText('100.00 CST')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'myPages.transferCst.form.viewHistory' }),
    ).toHaveAttribute('href', `/cosmic-token-transfer/${SOURCE}`);
  });

  it('rejects an invalid recipient before writing', async () => {
    await renderReadyForm();
    fillTransferForm('1', 'not-an-address');

    submitTransferForm();

    expect(toast.error).toHaveBeenCalledWith('toasts.transfer.common.invalidRecipient');
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('rejects a zero amount before writing', async () => {
    await renderReadyForm();
    fillTransferForm('0');

    submitTransferForm();

    expect(toast.error).toHaveBeenCalledWith('toasts.transfer.common.amountPositive');
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('rejects a non-numeric amount before writing', async () => {
    await renderReadyForm();
    fillTransferForm('twelve');

    submitTransferForm();

    expect(toast.error).toHaveBeenCalledWith('toasts.transfer.common.invalidAmount');
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('rejects an amount above the source balance', async () => {
    await renderReadyForm();
    fillTransferForm('100.01');

    submitTransferForm();

    expect(toast.error).toHaveBeenCalledWith('toasts.transfer.cst.insufficientBalance');
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('does not submit while the CST token address is unavailable', async () => {
    mockContractAddresses = { ...TEST_APP_CONTRACT_ADDRESSES, cosmicToken: '' };
    renderWithQuery(<CstTransferForm sourceAddress={SOURCE} />);

    expect(
      screen.getByRole('button', { name: 'myPages.transferCst.form.sendAria' }),
    ).toBeDisabled();
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('requires the connected account to match the source wallet', async () => {
    mockAccount = OTHER_SOURCE;
    await renderReadyForm(SOURCE);
    fillTransferForm('1');

    submitTransferForm();

    expect(toast.error).toHaveBeenCalledWith('toasts.transfer.cst.sourceWalletRequired');
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('falls back to 18 decimals when the token decimals read fails', async () => {
    mockReadContract.mockImplementation(({ functionName }: { functionName: string }) => {
      if (functionName === 'decimals') return Promise.reject(new Error('decimals failed'));
      if (functionName === 'balanceOf') return Promise.resolve(100n * 10n ** 18n);
      return Promise.resolve(null);
    });

    await renderReadyForm();
    fillTransferForm('1.5');
    submitTransferForm();

    await waitFor(() =>
      expect(toast.warning).toHaveBeenCalledWith('toasts.transfer.cst.decimalsWarning'),
    );
    await waitFor(() => expect(mockWriteContract).toHaveBeenCalled());
    expect(mockReportError).toHaveBeenCalledWith(
      expect.any(Error),
      'Cosmic Signature CST decimals read',
    );
  });

  it('shows a balance error and disables submit when balanceOf fails', async () => {
    mockReadContract.mockImplementation(({ functionName }: { functionName: string }) => {
      if (functionName === 'decimals') return Promise.resolve(18);
      if (functionName === 'balanceOf') return Promise.reject(new Error('balance failed'));
      return Promise.resolve(null);
    });

    renderWithQuery(<CstTransferForm sourceAddress={SOURCE} />);

    expect(
      await screen.findByText('myPages.transferCst.form.balanceReadError'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'myPages.transferCst.form.sendAria' }),
    ).toBeDisabled();
  });

  it('calls standard ERC-20 transfer, waits for receipt, and invalidates related queries', async () => {
    await renderReadyForm();
    fillTransferForm('12.5');

    submitTransferForm();

    await waitFor(() => expect(mockWriteContract).toHaveBeenCalledTimes(1));
    expect(mockWriteContract).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'test-config' }),
      expect.objectContaining({
        address: TEST_APP_CONTRACT_ADDRESSES.cosmicToken,
        functionName: 'transfer',
        args: [RECIPIENT, 12500000000000000000n],
        account: SOURCE,
        chainId: 421614,
      }),
    );
    expect(mockWaitForTransactionReceipt).toHaveBeenCalledWith({ hash: TX_HASH });

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('toasts.transfer.cst.confirmed'),
    );
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['userBalance', SOURCE] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['userBalance', RECIPIENT] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['ctTransfers', SOURCE] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['ctTransfers', RECIPIENT] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['ctBalancesDistribution'] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['dashboardInfo'] });
    expect(
      screen.getByRole('link', { name: 'myPages.transferCst.form.viewTransaction' }),
    ).toHaveAttribute('href', expect.stringContaining(TX_HASH));
  });

  it('does not sign anything when the wallet is on the wrong chain', async () => {
    mockEnsureCorrectChain.mockResolvedValue(false);
    await renderReadyForm();
    fillTransferForm('12.5');

    submitTransferForm();

    await waitFor(() => expect(mockEnsureCorrectChain).toHaveBeenCalled());
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('shows an informational toast when the wallet rejects the transaction', async () => {
    mockWriteContract.mockRejectedValue({ code: 4001 });
    await renderReadyForm();
    fillTransferForm('1');

    submitTransferForm();

    await waitFor(() =>
      expect(toast.info).toHaveBeenCalledWith('toasts.walletTransactionCancelled'),
    );
    expect(mockWaitForTransactionReceipt).not.toHaveBeenCalled();
  });

  it('reports and displays contract write failures', async () => {
    const err = new Error('write failed');
    mockWriteContract.mockRejectedValue(err);
    await renderReadyForm();
    fillTransferForm('1');

    submitTransferForm();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('toasts.transfer.cst.failed'));
    expect(mockReportError).toHaveBeenCalledWith(err, 'Cosmic Signature CST transfer');
  });

  it('reports a reverted receipt and shows the localized CST fallback', async () => {
    mockWaitForTransactionReceipt.mockResolvedValueOnce({ status: 'reverted' });
    await renderReadyForm();
    fillTransferForm('1');

    submitTransferForm();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('toasts.transfer.cst.failed'));
    expect(mockReportError).toHaveBeenCalledWith(
      expect.any(Error),
      'Cosmic Signature CST transfer',
    );
    expect(toast.success).not.toHaveBeenCalled();
  });
});
