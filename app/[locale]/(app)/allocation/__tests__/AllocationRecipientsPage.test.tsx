import { ethDistributionFacts, protocolFacts } from '@/content/protocol-facts';

import { checkA11y, render, screen } from '@/test-utils';

import AllocationRecipientsPage from '../AllocationRecipientsPage';

const mockUseRoundList = jest.fn();

jest.mock('../../../../../hooks/useApiQuery', () => ({
  useRoundList: (...args: unknown[]) => mockUseRoundList(...args),
}));

let capturedList: unknown[] = [];
jest.mock('../../../../../components/tables/AllocationTable', () => ({
  AllocationTable: ({ list, loading }: { list: unknown[]; loading: boolean }) => {
    capturedList = list;
    return (
      <div data-testid="allocation-table">{loading ? 'Loading...' : `rows: ${list.length}`}</div>
    );
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  capturedList = [];
});

const createRound = (overrides = {}) => ({
  TimeStamp: 100,
  AmountEth: 1.5,
  RecipientAddr: '0xRecipient',
  RoundStats: { TotalBids: 10 },
  ...overrides,
});

describe('AllocationRecipientsPage', () => {
  it('renders the heading', () => {
    mockUseRoundList.mockReturnValue({ data: [], isLoading: false });
    render(<AllocationRecipientsPage />);
    expect(screen.getByText('allocation.recipients.header.title')).toBeInTheDocument();
  });

  it('renders the enhanced subtitle', () => {
    mockUseRoundList.mockReturnValue({ data: [], isLoading: false });
    render(<AllocationRecipientsPage />);
    expect(screen.getByText(/allocation\.recipients\.header\.subtitle/i)).toBeInTheDocument();
  });

  it('renders page-scope and reserve-split tooltips', () => {
    mockUseRoundList.mockReturnValue({ data: [], isLoading: false });
    render(<AllocationRecipientsPage />);

    expect(
      screen.getByRole('button', {
        name: 'More information about allocation.recipients.header.scope',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'More information about allocation.recipients.reserveSplit.label',
      }),
    ).toBeInTheDocument();
  });

  it('passes loading state to AllocationTable', () => {
    mockUseRoundList.mockReturnValue({ data: [], isLoading: true });
    render(<AllocationRecipientsPage />);
    expect(screen.getByTestId('allocation-table')).toHaveTextContent('Loading...');
  });

  it('sorts data by TimeStamp descending', () => {
    mockUseRoundList.mockReturnValue({
      data: [
        createRound({ TimeStamp: 100, id: 'a' }),
        createRound({ TimeStamp: 300, id: 'c' }),
        createRound({ TimeStamp: 200, id: 'b' }),
      ],
      isLoading: false,
    });
    render(<AllocationRecipientsPage />);
    expect(capturedList).toEqual([
      expect.objectContaining({ TimeStamp: 300, id: 'c' }),
      expect.objectContaining({ TimeStamp: 200, id: 'b' }),
      expect.objectContaining({ TimeStamp: 100, id: 'a' }),
    ]);
  });

  it('renders empty table for no data', () => {
    mockUseRoundList.mockReturnValue({ data: [], isLoading: false });
    render(<AllocationRecipientsPage />);
    expect(screen.getByTestId('allocation-table')).toHaveTextContent('rows: 0');
  });

  it('renders contract-aligned allocation track percentages', () => {
    mockUseRoundList.mockReturnValue({ data: [], isLoading: false });
    render(<AllocationRecipientsPage />);
    // Under V3 defaults several tracks share the same percentage, so use
    // getAllByText and assert at least one element per expected value.
    for (const percent of [
      ethDistributionFacts.mainEthPercentage,
      ethDistributionFacts.chronoWarriorEthPercentage,
      ethDistributionFacts.stellarSelectionEthPercentage,
      ethDistributionFacts.anchorDistributionPercentage,
      ethDistributionFacts.publicGoodsPercentage,
    ]) {
      expect(screen.getAllByText(`${percent}%`).length).toBeGreaterThanOrEqual(1);
    }
    expect(screen.getByText(`~${protocolFacts.compoundingReservePercentage}%`)).toBeInTheDocument();
  });

  it('renders help tooltips for allocation track labels', () => {
    mockUseRoundList.mockReturnValue({ data: [], isLoading: false });
    render(<AllocationRecipientsPage />);

    for (const track of ['signature', 'chrono', 'stellar', 'anchor', 'publicGoods', 'nextCycle']) {
      expect(
        screen.getByRole('button', {
          name: `More information about allocation.recipients.reserveSplit.tracks.${track}.label`,
        }),
      ).toBeInTheDocument();
    }
  });

  describe('summary statistics', () => {
    it('renders summary stats when data is available', () => {
      mockUseRoundList.mockReturnValue({
        data: [
          createRound({ AmountEth: 1.5, WinnerAddr: '0xA', RoundStats: { TotalBids: 10 } }),
          createRound({ AmountEth: 2.5, WinnerAddr: '0xB', RoundStats: { TotalBids: 20 } }),
          createRound({ AmountEth: 3.0, WinnerAddr: '0xA', RoundStats: { TotalBids: 30 } }),
        ],
        isLoading: false,
      });
      render(<AllocationRecipientsPage />);

      const statsContainer = screen.getByTestId('summary-stats');
      expect(statsContainer).toBeInTheDocument();

      expect(screen.getByTestId('summary-stat-total-cycles')).toHaveTextContent('3');
      expect(screen.getByTestId('summary-stat-total-eth-distributed')).toHaveTextContent(
        '7.00 ETH',
      );
      expect(screen.getByTestId('summary-stat-total-gestures')).toHaveTextContent('60');
      expect(screen.getByTestId('summary-stat-unique-recipients')).toHaveTextContent('2');
    });

    it('does not render summary stats when data is empty', () => {
      mockUseRoundList.mockReturnValue({ data: [], isLoading: false });
      render(<AllocationRecipientsPage />);
      expect(screen.queryByTestId('summary-stats')).not.toBeInTheDocument();
    });

    it('shows skeleton loading for summary stats while loading', () => {
      mockUseRoundList.mockReturnValue({ data: [], isLoading: true });
      const { container } = render(<AllocationRecipientsPage />);
      const skeletons = container.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  it('has no accessibility violations', async () => {
    mockUseRoundList.mockReturnValue({ data: [], isLoading: false });
    const { container } = render(<AllocationRecipientsPage />);
    await checkA11y(container);
  });

  it('has no accessibility violations with data', async () => {
    mockUseRoundList.mockReturnValue({
      data: [createRound(), createRound({ TimeStamp: 200, RecipientAddr: '0xB' })],
      isLoading: false,
    });
    const { container } = render(<AllocationRecipientsPage />);
    await checkA11y(container);
  });
});
