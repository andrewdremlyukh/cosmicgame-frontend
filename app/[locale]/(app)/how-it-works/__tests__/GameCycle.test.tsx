import { howItWorksContentEn } from '@/content/how-it-works';
import { ethDistributionFacts } from '@/content/protocol-facts';

import { TooltipProvider } from '@/components/ui/tooltip';

import { render, screen, checkA11y } from '@/test-utils';

import { GameCycle } from '../components/GameCycle';

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

const gameCycle = howItWorksContentEn.gameCycle;

describe('GameCycle', () => {
  it('renders the section heading', () => {
    renderWithTooltip(<GameCycle gameCycle={gameCycle} />);
    expect(
      screen.getByRole('heading', { name: 'Lifecycle of a Performance Cycle' }),
    ).toBeInTheDocument();
  });

  it('renders all six phase labels in order', () => {
    renderWithTooltip(<GameCycle gameCycle={gameCycle} />);
    expect(screen.getByText('Cycle Opens')).toBeInTheDocument();
    expect(screen.getByText('Participants Gesture')).toBeInTheDocument();
    expect(screen.getByText('Cycle Finalization Time Expires')).toBeInTheDocument();
    expect(screen.getByText('Cycle Finalizes')).toBeInTheDocument();
    expect(screen.getByText('Stellar Selections')).toBeInTheDocument();
    expect(screen.getByText('Next Cycle')).toBeInTheDocument();
  });

  it('renders phase numbers 01 through 06', () => {
    renderWithTooltip(<GameCycle gameCycle={gameCycle} />);
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('02')).toBeInTheDocument();
    expect(screen.getByText('03')).toBeInTheDocument();
    expect(screen.getByText('04')).toBeInTheDocument();
    expect(screen.getByText('05')).toBeInTheDocument();
    expect(screen.getByText('06')).toBeInTheDocument();
  });

  it('renders every phase description from the content module', () => {
    renderWithTooltip(<GameCycle gameCycle={gameCycle} />);
    for (const phase of gameCycle.phases) {
      expect(screen.getByText(phase.description)).toBeInTheDocument();
    }
    expect(screen.getByText(/first ETH Calibration Window opens/)).toBeInTheDocument();
    expect(
      screen.getByText(
        new RegExp(`${ethDistributionFacts.mainEthPercentage}% of the Cycle Reserve`),
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Three ETH Stellar Selection recipients/)).toBeInTheDocument();
  });

  it('does not claim that gestures stop when the countdown expires', () => {
    // Contract behavior: gestures stay open until finalization executes, and a
    // late gesture takes over the Final Gesture position.
    renderWithTooltip(<GameCycle gameCycle={gameCycle} />);
    expect(screen.queryByText(/the cycle closes/)).not.toBeInTheDocument();
    expect(screen.queryByText(/No more gestures/)).not.toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithTooltip(<GameCycle gameCycle={gameCycle} />);
    await checkA11y(container);
  });
});
