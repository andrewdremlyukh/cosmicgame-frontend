import { howItWorksContentEn } from '@/content/how-it-works';
import { ethDistributionFacts } from '@/content/protocol-facts';

import { TooltipProvider } from '@/components/ui/tooltip';

import { render, screen, checkA11y } from '@/test-utils';

import { RewardBreakdown } from '../components/RewardBreakdown';

jest.mock('framer-motion', () => {
  const React = require('react');
  const cache: Record<string, React.ForwardRefExoticComponent<unknown>> = {};
  return {
    motion: new Proxy(
      {},
      {
        get: (_target: unknown, prop: string) => {
          if (!cache[prop]) {
            const Comp = React.forwardRef(function MotionProxy(
              props: Record<string, unknown>,
              ref: React.Ref<HTMLElement>,
            ) {
              const {
                initial: _i,
                animate: _a,
                whileInView: _w,
                viewport: _v,
                transition: _t,
                variants: _va,
                ...rest
              } = props;
              return React.createElement(prop, { ...rest, ref });
            });
            Comp.displayName = `motion.${prop}`;
            cache[prop] = Comp;
          }
          return cache[prop];
        },
      },
    ),
  };
});

const renderWithTooltip = (ui: React.ReactElement) =>
  render(<TooltipProvider>{ui}</TooltipProvider>);

const rewardBreakdown = howItWorksContentEn.rewardBreakdown;

describe('RewardBreakdown', () => {
  it('renders the section heading', () => {
    renderWithTooltip(<RewardBreakdown rewardBreakdown={rewardBreakdown} />);
    expect(
      screen.getByRole('heading', { name: 'What Every Gesture Imprints' }),
    ).toBeInTheDocument();
  });

  it('renders all four reward titles', () => {
    renderWithTooltip(<RewardBreakdown rewardBreakdown={rewardBreakdown} />);
    expect(screen.getByText('Dynamic Participation CST')).toBeInTheDocument();
    expect(screen.getByText('Stellar Selection Entry')).toBeInTheDocument();
    expect(screen.getByText('Cosmic Signature NFT Selection')).toBeInTheDocument();
    expect(screen.getByText('Signature Allocation')).toBeInTheDocument();
  });

  it('renders every reward description from the content module', () => {
    renderWithTooltip(<RewardBreakdown rewardBreakdown={rewardBreakdown} />);
    for (const item of rewardBreakdown.items) {
      expect(screen.getByText(item.description)).toBeInTheDocument();
    }
    expect(
      screen.getByText(/receive 1,000 CST and a unique Cosmic Signature NFT/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(`${ethDistributionFacts.mainEthPercentage}% of the Cycle Reserve`),
      ),
    ).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithTooltip(<RewardBreakdown rewardBreakdown={rewardBreakdown} />);
    await checkA11y(container);
  });
});
