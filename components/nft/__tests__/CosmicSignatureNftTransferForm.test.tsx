import { toast } from 'sonner';
import userEvent from '@testing-library/user-event';

import { TEST_APP_CONTRACT_ADDRESSES } from '@/test-utils/contractAddressesFixture';

import { COSMIC_SIGNATURE_MARKETPLACE_URL } from '@/config/marketplace';
import type { CSTTokenInfo } from '@/services/api/types';

import { checkA11y, fireEvent, render, screen, waitFor } from '@/test-utils';

import { CosmicSignatureNftTransferForm } from '../CosmicSignatureNftTransferForm';

const SOURCE = '0x1111111111111111111111111111111111111111';
const OTHER_SOURCE = '0x2222222222222222222222222222222222222222';
const RECIPIENT = '0x3333333333333333333333333333333333333333';
const TX_HASH_1 = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const TX_HASH_2 = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

const mockWriteContract = jest.fn();
const mockWaitForTransactionReceipt = jest.fn();
const mockInvalidateQueries = jest.fn();
const mockEthereumRequest = jest.fn();
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
  },
}));

function createToken(overrides: Partial<CSTTokenInfo> = {}): CSTTokenInfo {
  return {
    EvtLogId: overrides.EvtLogId ?? overrides.TokenId ?? 1,
    BlockNum: 100,
    TxId: 1,
    TxHash: '0xabc123',
    TimeStamp: 1701346718,
    DateTime: '2023-11-30',
    TokenId: 1,
    TokenName: 'Alpha',
    CurOwnerAddr: SOURCE,
    RoundNum: 5,
    WinnerAddr: SOURCE,
    Staked: false,
    ...overrides,
  };
}

function renderForm(tokens: CSTTokenInfo[] = [createToken()]) {
  render(
    <CosmicSignatureNftTransferForm
      sourceAddress={SOURCE}
      tokens={tokens}
      historyHref={`/cosmic-signature-transfer/${SOURCE}`}
    />,
  );
}

function fillRecipient(value = RECIPIENT) {
  fireEvent.change(screen.getByLabelText('myPages.nftTransfer.recipientAddress'), {
    target: { value },
  });
}

function getTokenRow(nameOrId: string | RegExp) {
  const row = screen.getByText(nameOrId).closest('[data-testid^="nft-row-"]');
  expect(row).not.toBeNull();
  return row as HTMLElement;
}

function selectToken(nameOrId: string | RegExp) {
  fireEvent.click(getTokenRow(nameOrId));
}

function submitForm() {
  const button = screen.getByRole('button', { name: 'myPages.nftTransfer.sendAria' });
  const form = button.closest('form');
  expect(form).not.toBeNull();
  fireEvent.submit(form!);
}

describe('CosmicSignatureNftTransferForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnsureCorrectChain.mockResolvedValue(true);
    mockAccount = SOURCE;
    mockActive = true;
    mockContractAddresses = TEST_APP_CONTRACT_ADDRESSES;
    mockWriteContract.mockResolvedValueOnce(TX_HASH_1).mockResolvedValueOnce(TX_HASH_2);
    mockWaitForTransactionReceipt.mockResolvedValue({ status: 'success' });
    mockInvalidateQueries.mockResolvedValue(undefined);
    mockEthereumRequest.mockResolvedValue('0x1');
    Object.defineProperty(window, 'ethereum', {
      configurable: true,
      value: { request: mockEthereumRequest },
    });
  });

  it('renders source wallet, owned NFTs, selectable rows, and history link', () => {
    renderForm([
      createToken({ TokenId: 1, TokenName: 'Alpha' }),
      createToken({ TokenId: 2, TokenName: 'Beta', EvtLogId: 2 }),
    ]);

    expect(screen.getAllByText('0x111111....111111')).toHaveLength(1);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getAllByLabelText(/myPages\.nftTransfer\.selectAria/)).toHaveLength(2);
    expect(screen.queryByLabelText('Select Cosmic Signature NFTs')).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'myPages.nftTransfer.selectAll' })).toHaveLength(
      1,
    );
    expect(screen.getByRole('link', { name: 'myPages.nftTransfer.viewHistory' })).toHaveAttribute(
      'href',
      `/cosmic-signature-transfer/${SOURCE}`,
    );
  });

  it('links sellers to the Cosmic Signature marketplace', () => {
    renderForm();

    expect(screen.getByRole('link', { name: 'nav.ecosystem.axiomZero.ariaLabel' })).toHaveAttribute(
      'href',
      COSMIC_SIGNATURE_MARKETPLACE_URL,
    );
  });

  it('renders clear NFT metadata labels and values', () => {
    renderForm([
      createToken({ TokenId: 1, TokenName: 'Alpha', RoundNum: 42 }),
      createToken({ TokenId: 2, TokenName: '', RoundNum: undefined, EvtLogId: 2 }),
    ]);

    expect(screen.getAllByText('myPages.nftTransfer.customName')).toHaveLength(2);
    expect(screen.getAllByText('myPages.nftTransfer.generationCycle')).toHaveLength(2);
    expect(getTokenRow('Alpha')).toHaveTextContent('myPages.nftTransfer.cycle(cycle=42)');
    expect(getTokenRow('myPages.nftTransfer.noCustomName')).toHaveTextContent(
      'myPages.nftTransfer.cycleUnavailable',
    );
    expect(screen.queryByText('Unnamed')).not.toBeInTheDocument();
    expect(screen.queryByText('Unknown')).not.toBeInTheDocument();
  });

  it('treats cycle 0 as a real generation cycle', () => {
    renderForm([createToken({ TokenId: 1, TokenName: 'Deployment NFT', RoundNum: 0 })]);

    const row = getTokenRow('Deployment NFT');
    expect(row).toHaveTextContent('myPages.nftTransfer.cycle(cycle=0)');
    expect(
      screen.getByRole('link', { name: 'myPages.nftTransfer.cycle(cycle=0)' }),
    ).toHaveAttribute('href', '/allocation/0');
    expect(screen.queryByText('myPages.nftTransfer.cycleUnavailable')).not.toBeInTheDocument();
  });

  it('does not repeat owner addresses inside NFT rows', () => {
    renderForm([
      createToken({ TokenId: 1, TokenName: 'Alpha', EvtLogId: 1 }),
      createToken({ TokenId: 2, TokenName: 'Beta', EvtLogId: 2 }),
      createToken({
        TokenId: 3,
        TokenName: 'Stale owner',
        EvtLogId: 3,
        CurOwnerAddr: OTHER_SOURCE,
      }),
    ]);

    expect(screen.queryByText('Current Owner')).not.toBeInTheDocument();
    expect(screen.getByTestId('nft-transfer-picker')).not.toHaveTextContent('0x111111....111111');
    expect(screen.getByTestId('nft-transfer-picker')).not.toHaveTextContent('0x222222....222222');
    expect(document.querySelector(`a[href="/user/${SOURCE}"]`)).toBeNull();
    expect(document.querySelector(`a[href="/user/${OTHER_SOURCE}"]`)).toBeNull();
  });

  it('allows the recipient address to be typed normally', async () => {
    const user = userEvent.setup();
    renderForm();

    const input = screen.getByLabelText('myPages.nftTransfer.recipientAddress');
    await user.type(input, RECIPIENT);

    expect(input).toHaveValue(RECIPIENT);
  });

  it('selects and unselects NFTs from row clicks', async () => {
    const user = userEvent.setup();
    renderForm([
      createToken({ TokenId: 1, TokenName: 'Alpha' }),
      createToken({ TokenId: 2, TokenName: 'Beta', EvtLogId: 2 }),
    ]);

    await user.click(getTokenRow('Alpha'));

    expect(screen.getByLabelText('myPages.nftTransfer.selectAria(id=1)')).toBeChecked();
    expect(
      screen.getByText('myPages.nftTransfer.pickerSummary(selected=1,total=2)'),
    ).toBeInTheDocument();
    expect(getTokenRow('Alpha')).toHaveTextContent('myPages.nftTransfer.statusLabels.selected');

    await user.click(getTokenRow('Alpha'));

    expect(screen.getByLabelText('myPages.nftTransfer.selectAria(id=1)')).not.toBeChecked();
    expect(
      screen.getByText('myPages.nftTransfer.pickerSummary(selected=0,total=2)'),
    ).toBeInTheDocument();
  });

  it('selects and unselects NFTs from the checkbox without double toggling', async () => {
    const user = userEvent.setup();
    renderForm();

    const checkbox = screen.getByLabelText('myPages.nftTransfer.selectAria(id=1)');
    await user.click(checkbox);

    expect(checkbox).toBeChecked();
    expect(
      screen.getByText('myPages.nftTransfer.pickerSummary(selected=1,total=1)'),
    ).toBeInTheDocument();

    await user.click(checkbox);

    expect(checkbox).not.toBeChecked();
    expect(
      screen.getByText('myPages.nftTransfer.pickerSummary(selected=0,total=1)'),
    ).toBeInTheDocument();
  });

  it('bulk-selects only transferable NFTs and clears selection', async () => {
    const user = userEvent.setup();
    renderForm([
      createToken({ TokenId: 1, TokenName: 'Alpha', EvtLogId: 1 }),
      createToken({ TokenId: 2, TokenName: 'Anchored', EvtLogId: 2, Staked: true }),
      createToken({
        TokenId: 3,
        TokenName: 'Stale owner',
        EvtLogId: 3,
        CurOwnerAddr: OTHER_SOURCE,
      }),
    ]);

    await user.click(screen.getByRole('button', { name: 'myPages.nftTransfer.selectAll' }));

    expect(screen.getByLabelText('myPages.nftTransfer.selectAria(id=1)')).toBeChecked();
    expect(screen.getByLabelText('myPages.nftTransfer.selectAria(id=2)')).not.toBeChecked();
    expect(screen.getByLabelText('myPages.nftTransfer.selectAria(id=3)')).not.toBeChecked();
    expect(
      screen.getByText('myPages.nftTransfer.pickerSummary(selected=1,total=1)'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'myPages.nftTransfer.clear' }));

    expect(screen.getByLabelText('myPages.nftTransfer.selectAria(id=1)')).not.toBeChecked();
    expect(
      screen.getByText('myPages.nftTransfer.pickerSummary(selected=0,total=1)'),
    ).toBeInTheDocument();
  });

  it('keeps picker controls usable when NFTs include owner metadata', async () => {
    const user = userEvent.setup();
    renderForm([
      createToken({ TokenId: 1, TokenName: 'Alpha', EvtLogId: 1 }),
      createToken({ TokenId: 2, TokenName: 'Beta', EvtLogId: 2 }),
    ]);

    await user.type(screen.getByLabelText('myPages.nftTransfer.recipientAddress'), RECIPIENT);
    await user.click(screen.getByRole('button', { name: 'myPages.nftTransfer.selectPage' }));

    expect(screen.getByLabelText('myPages.nftTransfer.recipientAddress')).toHaveValue(RECIPIENT);
    expect(screen.getByLabelText('myPages.nftTransfer.selectAria(id=1)')).toBeChecked();
    expect(screen.getByLabelText('myPages.nftTransfer.selectAria(id=2)')).toBeChecked();
    expect(screen.getByRole('button', { name: 'myPages.nftTransfer.sendAria' })).toBeEnabled();
  });

  it('shows anchored NFTs but keeps them unselectable', () => {
    renderForm([
      createToken({ TokenId: 1, TokenName: 'Transferable' }),
      createToken({ TokenId: 2, TokenName: 'Anchored', EvtLogId: 2, Staked: true }),
    ]);

    selectToken('Anchored');
    expect(screen.getByText('myPages.nftTransfer.statusLabels.anchored')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'myPages.nftTransfer.sendAria' })).toBeDisabled();
  });

  it('keeps stale-owner NFTs unselectable', async () => {
    const user = userEvent.setup();
    renderForm([
      createToken({
        TokenId: 1,
        TokenName: 'Stale owner',
        CurOwnerAddr: OTHER_SOURCE,
      }),
    ]);

    await user.click(getTokenRow('Stale owner'));

    expect(screen.getByText('myPages.nftTransfer.statusLabels.ownerChanged')).toBeInTheDocument();
    expect(screen.getByLabelText('myPages.nftTransfer.selectAria(id=1)')).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'myPages.nftTransfer.sendAria' })).toBeDisabled();
  });

  it('rejects an invalid recipient before writing', () => {
    renderForm();
    selectToken('Alpha');
    fillRecipient('not-an-address');

    submitForm();

    expect(toast.error).toHaveBeenCalledWith('toasts.transfer.common.invalidRecipient');
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('rejects sending to the connected wallet', () => {
    renderForm();
    selectToken('Alpha');
    fillRecipient(SOURCE);

    submitForm();

    expect(toast.error).toHaveBeenCalledWith('toasts.transfer.nft.recipientMustDiffer');
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('does not sign anything when the wallet is on the wrong chain', async () => {
    mockEnsureCorrectChain.mockResolvedValue(false);
    renderForm();
    selectToken('Alpha');
    fillRecipient();

    submitForm();

    await waitFor(() => expect(mockEnsureCorrectChain).toHaveBeenCalled());
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('requires the connected account to match the source wallet', () => {
    mockAccount = OTHER_SOURCE;
    renderForm();
    selectToken('Alpha');
    fillRecipient();

    submitForm();

    expect(toast.error).toHaveBeenCalledWith('toasts.transfer.nft.sourceWalletRequired');
    expect(mockWriteContract).not.toHaveBeenCalled();
  });

  it('sends selected NFTs sequentially and invalidates related queries', async () => {
    renderForm([
      createToken({ TokenId: 1, TokenName: 'Alpha', EvtLogId: 1 }),
      createToken({ TokenId: 2, TokenName: 'Beta', EvtLogId: 2 }),
      createToken({ TokenId: 3, TokenName: 'Gamma', EvtLogId: 3, Staked: true }),
    ]);
    selectToken('Alpha');
    selectToken('Beta');
    fillRecipient();

    submitForm();

    await waitFor(() => expect(mockWriteContract).toHaveBeenCalledTimes(2));
    expect(mockWriteContract).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ id: 'test-config' }),
      expect.objectContaining({
        address: TEST_APP_CONTRACT_ADDRESSES.cosmicSignature,
        functionName: 'transferFrom',
        args: [SOURCE, RECIPIENT, 1n],
        account: SOURCE,
        chainId: 421614,
      }),
    );
    expect(mockWriteContract).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ id: 'test-config' }),
      expect.objectContaining({
        args: [SOURCE, RECIPIENT, 2n],
      }),
    );
    expect(mockWaitForTransactionReceipt).toHaveBeenCalledWith({ hash: TX_HASH_1 });
    expect(mockWaitForTransactionReceipt).toHaveBeenCalledWith({ hash: TX_HASH_2 });

    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('toasts.transfer.nft.confirmed(count=2)'),
    );
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['cstTokensByUser', SOURCE],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: ['cstTokensByUser', RECIPIENT],
    });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['cstTransfers', SOURCE] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['cstTransfers', RECIPIENT] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['cstInfo', 1] });
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['cstInfo', 2] });
  });

  it('keeps successful transfers and reports the failed token when a later transfer fails', async () => {
    mockWriteContract.mockReset();
    mockWriteContract.mockResolvedValueOnce(TX_HASH_1).mockRejectedValueOnce(new Error('boom'));

    renderForm([
      createToken({ TokenId: 1, TokenName: 'Alpha', EvtLogId: 1 }),
      createToken({ TokenId: 2, TokenName: 'Beta', EvtLogId: 2 }),
    ]);
    selectToken('Alpha');
    selectToken('Beta');
    fillRecipient();

    submitForm();

    await waitFor(() =>
      expect(screen.getByText('myPages.nftTransfer.progress.stopped(id=2)')).toBeInTheDocument(),
    );
    expect(mockWriteContract).toHaveBeenCalledTimes(2);
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['cstInfo', 1] });
    expect(mockInvalidateQueries).not.toHaveBeenCalledWith({ queryKey: ['cstInfo', 2] });
    expect(toast.error).toHaveBeenCalledWith('toasts.transfer.nft.failedToken(tokenId=2)');
  });

  it('shows an informational toast when the wallet rejects the first transaction', async () => {
    mockWriteContract.mockReset();
    mockWriteContract.mockRejectedValueOnce({ code: 4001 });

    renderForm();
    selectToken('Alpha');
    fillRecipient();

    submitForm();

    await waitFor(() =>
      expect(toast.info).toHaveBeenCalledWith('toasts.walletTransactionCancelled'),
    );
    expect(mockInvalidateQueries).not.toHaveBeenCalled();
  });

  it('stops on a reverted receipt and shows the localized token failure', async () => {
    mockWaitForTransactionReceipt.mockResolvedValueOnce({ status: 'reverted' });
    renderForm();
    selectToken('Alpha');
    fillRecipient();

    submitForm();

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('toasts.transfer.nft.failedToken(tokenId=1)'),
    );
    expect(mockReportError).toHaveBeenCalledWith(
      expect.any(Error),
      'Cosmic Signature NFT transfer',
    );
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('asks for confirmation before transferring to an address with no transaction history', async () => {
    mockEthereumRequest.mockResolvedValue('0x0');

    renderForm();
    selectToken('Alpha');
    fillRecipient();

    submitForm();

    expect(await screen.findByText('myPages.nftTransfer.warning.title')).toBeInTheDocument();
    expect(mockWriteContract).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'myPages.nftTransfer.warning.continue' }));

    await waitFor(() => expect(mockWriteContract).toHaveBeenCalledTimes(1));
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <CosmicSignatureNftTransferForm
        sourceAddress={SOURCE}
        tokens={[
          createToken({ TokenId: 1, TokenName: 'Alpha', EvtLogId: 1 }),
          createToken({ TokenId: 2, TokenName: 'Anchored', EvtLogId: 2, Staked: true }),
        ]}
        historyHref={`/cosmic-signature-transfer/${SOURCE}`}
      />,
    );

    await checkA11y(container);
  });
});
