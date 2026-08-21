'use client';

import { useState, useEffect, useMemo, type FC, type ReactNode } from 'react';
import Image from 'next/image';
import {
  ArrowUpRight,
  Coins,
  Gift,
  History,
  Layers,
  LayoutDashboard,
  Menu,
  type LucideIcon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { formatEther } from 'viem';

import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { cn } from '@/lib/utils';
import getNAVs, { type NavDescriptor } from '@/config/nav';
import { getEcosystemDestinations } from '@/config/ecosystem';
import { AddCstToMetaMaskButton } from '@/components/common/AddCstToMetaMaskButton';
import ConnectWalletButton from '@/components/common/ConnectWalletButton';
import ListNavItem from '@/components/common/ListNavItem';
import { EcosystemDock } from '@/components/layout/EcosystemDock';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { AppBarWrapper, DrawerList } from '@/components/styled';
import { useApiData } from '@/contexts/ApiDataContext';
import { useActiveWeb3React } from '@/hooks/web3';
import { useUserBalance, useUserInfo } from '@/hooks/useApiQuery';
import { useAnchoredToken } from '@/contexts/AnchoredTokenContext';
import { useSystemMode } from '@/contexts/SystemModeContext';
import useRWLKNFTContract from '@/hooks/useRWLKNFTContract';
import { HEADER_POLL_INTERVAL_MS } from '@/config/constants';
import { formatFixed } from '@/utils/format';
import { reportErrorThrottled } from '@/utils/errors';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';

interface Balance {
  CosmicToken: number;
  ETH: number;
  CosmicSignature: number;
  RWLK: number;
}

/** Section label used throughout the mobile drawer. */
const DrawerHeading: FC<{ children: ReactNode }> = ({ children }) => (
  <p className="px-5 pb-1.5 pt-4 font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-white/40">
    {children}
  </p>
);

/** Icon tile shared by drawer rows: falls back to a dot when no icon is set. */
const DrawerIconTile: FC<{ icon?: LucideIcon; className?: string }> = ({
  icon: Icon,
  className,
}) => (
  <span
    className={cn(
      'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.04] text-white/55',
      className,
    )}
    aria-hidden
  >
    {Icon ? <Icon className="h-4 w-4" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
  </span>
);

const isExternalRoute = (route?: string) => !!route && /^https?:\/\//.test(route);

/** One navigation row in the mobile drawer. */
const DrawerNavRow: FC<{ item: NavDescriptor; onNavigate: () => void }> = ({
  item,
  onNavigate,
}) => {
  const rowClassName =
    'flex items-center gap-3 px-5 py-2.5 text-sm text-white/75 no-underline transition-colors duration-[var(--duration-fast)] hover:bg-white/[0.04] hover:text-white';

  const content = (
    <>
      <DrawerIconTile icon={item.icon} />
      <span className="flex items-center gap-1.5">{item.title}</span>
      {item.external ? (
        <ArrowUpRight className="ml-auto h-3.5 w-3.5 shrink-0 text-white/30" aria-hidden />
      ) : null}
    </>
  );

  if (isExternalRoute(item.route)) {
    return (
      <a href={item.route} rel="noopener" className={rowClassName}>
        {content}
      </a>
    );
  }

  return (
    <Link href={item.route ?? '#'} className={rowClassName} onClick={onNavigate}>
      {content}
    </Link>
  );
};

/** Featured drawer rows (e.g. Discover) render as a gradient card. */
const DrawerFeaturedCard: FC<{ item: NavDescriptor }> = ({ item }) => {
  const Icon = item.icon;
  return (
    <a
      href={item.route}
      rel="noopener"
      className="group mx-4 mt-2 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-[linear-gradient(120deg,rgb(var(--aurora-cyan-rgb)/0.07),rgb(var(--nebula-violet-rgb)/0.14))] px-3 py-3 no-underline transition-colors duration-[var(--duration-fast)] hover:border-[rgb(var(--aurora-cyan-rgb)/0.35)]"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-signature-gradient text-white"
        aria-hidden
      >
        {Icon ? <Icon className="h-4 w-4" /> : null}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-sm font-medium leading-tight text-white">{item.title}</span>
        {item.description ? (
          <span className="mt-0.5 text-xs leading-snug text-white/55">{item.description}</span>
        ) : null}
      </span>
      <ArrowUpRight
        className="ml-auto h-4 w-4 shrink-0 text-white/45 transition-colors group-hover:text-white"
        aria-hidden
      />
    </a>
  );
};

const Header: FC = () => {
  const t = useTranslations('nav');
  const walletT = useTranslations('wallet');
  const locale = useLocale() as AppLocale;
  const [mobileView, setMobileView] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);

  const { apiData: status } = useApiData();
  const { account } = useActiveWeb3React();
  const nftContract = useRWLKNFTContract();

  const { data: userBalance, isLoading: isLoadingBalance } = useUserBalance(account);
  const { data: userInfo, isLoading: isLoadingUserInfo } = useUserInfo(account);

  const [rwlkCount, setRwlkCount] = useState<number>(0);
  useEffect(() => {
    if (!account || !nftContract) return;
    const fetchRwlk = async () => {
      try {
        const tokens = (await nftContract.read.walletOfOwner?.([account as `0x${string}`])) as
          | readonly bigint[]
          | undefined;
        setRwlkCount(tokens?.length ?? 0);
      } catch (err) {
        // Keep the last known count: resetting to 0 on a transient RPC failure
        // tells the user their NFTs are gone. Throttled because this polls.
        reportErrorThrottled(err, 'header RWLK balance');
      }
    };
    fetchRwlk();
    const intervalId = setInterval(fetchRwlk, HEADER_POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [account, nftContract]);

  const balance = useMemo<Balance>(
    () => ({
      CosmicToken: userBalance ? Number(formatEther(BigInt(userBalance.CosmicTokenBalance))) : 0,
      ETH: userBalance ? Number(formatEther(BigInt(userBalance.ETH_Balance))) : 0,
      CosmicSignature: userInfo?.UserInfo?.TotalCSTokensWon ?? 0,
      RWLK: rwlkCount,
    }),
    [userBalance, userInfo, rwlkCount],
  );

  const loading = (!!account && !!nftContract && (isLoadingBalance || isLoadingUserInfo)) || false;

  const { cstokens: anchoredCSTokens, rwlktokens: anchoredRWLKTokens } = useAnchoredToken();

  const systemModeCtx = useSystemMode();
  const systemMode = systemModeCtx?.data ?? 0;

  useEffect(() => {
    const handleWindowResize = () => {
      setMobileView(window.innerWidth < 1024);
    };

    handleWindowResize();

    window.addEventListener('resize', handleWindowResize);
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  const navs = getNAVs(status, account, t, locale);
  const ecosystemDestinations = getEcosystemDestinations(t);
  const standaloneNavs = navs.filter((nav) => !nav.children);
  const groupedNavs = navs.filter((nav) => nav.children);

  const handleDrawerOpen = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  const hasUnclaimedRewards = !!(
    account &&
    ((status?.ETHRaffleToClaim ?? 0) > 0 ||
      (status?.NumDonatedNFTToClaim ?? 0) > 0 ||
      ((status?.UnretrievedAnchorDistribution ?? 0) > 0 &&
        (status?.claimableActionIds?.length ?? 0) > 0))
  );

  const brand = (
    <Link
      href="/"
      aria-label={t('brand.homeLabel')}
      className="group flex shrink-0 items-center gap-3 rounded-full no-underline"
    >
      <span className="relative flex h-10 w-10 items-center justify-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgb(var(--aurora-cyan-rgb)/0.35),transparent_70%)] opacity-0 blur-md transition-opacity duration-[var(--duration-base)] group-hover:opacity-100"
        />
        <Image
          src="/images/logo2.svg"
          width={48}
          height={48}
          alt="Cosmic Signature"
          loading="eager"
          className="relative h-10 w-auto max-h-10 object-contain"
        />
      </span>
      <span className="hidden flex-col justify-center leading-none xl:flex">
        <span className="font-display text-[15px] font-semibold tracking-[0.02em] text-white">
          Cosmic Signature
        </span>
        <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.3em] text-white/40">
          {t('brand.tagline')}
        </span>
      </span>
    </Link>
  );

  const renderDesktop = () => (
    <nav aria-label={t('primaryLabel')} className="flex items-center gap-4 xl:gap-6">
      {brand}

      <div className="flex items-center gap-0.5 rounded-full border border-white/[0.07] bg-white/[0.03] p-1 shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] backdrop-blur-md">
        {navs.map((nav, i) => (
          <ListNavItem key={i} nav={nav} />
        ))}
      </div>

      <div className="ml-auto flex items-center gap-3">
        <EcosystemDock />
        <LanguageSwitcher />
        <ConnectWalletButton
          isMobileView={false}
          loading={loading}
          balance={balance}
          stakedTokenCount={{
            cst: anchoredCSTokens?.length,
            rwalk: anchoredRWLKTokens?.length,
          }}
          hasUnclaimedRewards={hasUnclaimedRewards}
        />
      </div>
    </nav>
  );

  const renderMobile = () => {
    return (
      <nav className="flex items-center gap-2.5">
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('menuLabel')}
          aria-haspopup="true"
          onClick={handleDrawerOpen}
          className="h-11 w-11 shrink-0 rounded-xl border border-white/[0.08] bg-white/[0.03] sm:h-10 sm:w-10"
        >
          {hasUnclaimedRewards ? (
            <span className="relative inline-flex">
              <Menu className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>

        <Link
          href="/"
          aria-label={t('brand.homeLabel')}
          className="flex items-center gap-2.5 no-underline"
        >
          <Image
            src="/images/logo2.svg"
            width={48}
            height={48}
            alt=""
            aria-hidden
            loading="eager"
            className="h-9 w-auto max-h-9 object-contain"
          />
          <span className="hidden font-display text-sm font-semibold tracking-[0.02em] text-white min-[480px]:inline">
            Cosmic Signature
          </span>
        </Link>

        <div className="ml-auto max-w-[12rem] overflow-hidden">
          <ConnectWalletButton
            isMobileView
            balance={balance}
            loading={loading}
            stakedTokenCount={{
              cst: anchoredCSTokens?.length,
              rwalk: anchoredRWLKTokens?.length,
            }}
            hasUnclaimedRewards={hasUnclaimedRewards}
          />
        </div>

        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent
            side="left"
            className="w-[320px] border-r border-white/[0.08] p-0 sm:max-w-[320px]"
          >
            <SheetTitle className="sr-only">{t('drawerTitle')}</SheetTitle>
            <DrawerList>
              {/* Brand */}
              <div className="flex items-center gap-2.5 border-b border-white/[0.06] px-5 pb-3.5 pt-2">
                <Image
                  src="/images/logo2.svg"
                  width={32}
                  height={32}
                  alt=""
                  aria-hidden
                  className="h-8 w-auto object-contain"
                />
                <span className="flex flex-col leading-none">
                  <span className="font-display text-sm font-semibold tracking-[0.02em] text-white">
                    Cosmic Signature
                  </span>
                  <span className="mt-1 font-mono text-[8px] uppercase tracking-[0.3em] text-white/40">
                    {t('brand.tagline')}
                  </span>
                </span>
              </div>

              <div className="px-5 py-4">
                <ConnectWalletButton
                  isMobileView
                  balance={balance}
                  loading={loading}
                  stakedTokenCount={{
                    cst: anchoredCSTokens?.length,
                    rwalk: anchoredRWLKTokens?.length,
                  }}
                />
              </div>

              <div className="px-5 pb-3">
                <LanguageSwitcher className="w-full justify-center" />
              </div>

              <Separator className="bg-white/[0.06]" />

              {/* Protocol: standalone destinations (Gallery, plus contextual items) */}
              <DrawerHeading>{t('sections.protocol')}</DrawerHeading>
              {standaloneNavs.map((nav, i) => (
                <DrawerNavRow key={i} item={nav} onNavigate={closeDrawer} />
              ))}

              {/* Grouped destinations (Explore, Help) */}
              {groupedNavs.map((group, i) => (
                <div key={i}>
                  <Separator className="my-2 bg-white/[0.06]" />
                  <DrawerHeading>{group.title}</DrawerHeading>
                  {group.children
                    ?.filter((child) => !child.featured)
                    .map((child, j) => (
                      <DrawerNavRow key={j} item={child} onNavigate={closeDrawer} />
                    ))}
                  {group.children
                    ?.filter((child) => child.featured)
                    .map((child, j) => (
                      <DrawerFeaturedCard key={`featured-${j}`} item={child} />
                    ))}
                </div>
              ))}

              <Separator className="my-2 bg-white/[0.06]" />

              {/* Ecosystem: Uniswap, Axiom Zero, Chaos Zero */}
              <DrawerHeading>{t('sections.ecosystem')}</DrawerHeading>
              {ecosystemDestinations.map((destination) => {
                const Icon = destination.icon;
                return (
                  <a
                    key={destination.id}
                    href={destination.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={destination.ariaLabel}
                    className="flex items-center gap-3 px-5 py-2.5 no-underline transition-colors duration-[var(--duration-fast)] hover:bg-white/[0.04]"
                  >
                    <DrawerIconTile icon={Icon} />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm leading-tight text-white/85">
                        {destination.name}
                      </span>
                      <span className="mt-0.5 text-xs leading-tight text-white/45">
                        {destination.product}
                      </span>
                    </span>
                    <ArrowUpRight
                      className="ml-auto h-3.5 w-3.5 shrink-0 text-white/30"
                      aria-hidden
                    />
                  </a>
                );
              })}

              {account && (
                <>
                  <Separator className="my-2 bg-white/[0.06]" />

                  {/* My Account */}
                  <DrawerHeading>{t('sections.myAccount')}</DrawerHeading>
                  <DrawerNavRow
                    item={{
                      title: t('links.myDashboard'),
                      route: '/my-statistics',
                      icon: LayoutDashboard,
                    }}
                    onNavigate={closeDrawer}
                  />
                  <DrawerNavRow
                    item={{
                      title: hasUnclaimedRewards ? (
                        <span className="flex items-center gap-2">
                          {t('links.myAllocations')}
                          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        </span>
                      ) : (
                        t('links.myAllocations')
                      ),
                      route: '/my-allocations',
                      icon: Gift,
                    }}
                    onNavigate={closeDrawer}
                  />
                  <DrawerNavRow
                    item={{ title: t('links.myNfts'), route: '/my-tokens', icon: Coins }}
                    onNavigate={closeDrawer}
                  />
                  <DrawerNavRow
                    item={{ title: t('links.myAnchors'), route: '/my-anchors', icon: Layers }}
                    onNavigate={closeDrawer}
                  />
                  <DrawerNavRow
                    item={{
                      title: t('links.recipientHistory'),
                      route: '/recipient-history',
                      icon: History,
                    }}
                    onNavigate={closeDrawer}
                  />

                  <Separator className="my-2 bg-white/[0.06]" />

                  {/* Balances */}
                  <div className="space-y-1.5 px-5 py-2">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-white/40">
                      {walletT('labels.balancesHeading')}
                    </p>
                    {loading ? (
                      <p className="text-xs text-primary">{walletT('labels.loading')}</p>
                    ) : (
                      <>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{walletT('balances.eth')}</span>
                          <span className="font-medium">{formatFixed(balance.ETH, 4)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{walletT('balances.cst')}</span>
                          <span className="font-medium">{formatFixed(balance.CosmicToken, 2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {walletT('balances.cosmicNfts')}
                          </span>
                          <span className="font-medium">
                            {walletT('labels.nftCount', {
                              count: balance.CosmicSignature,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            {walletT('balances.rwlkNfts')}
                          </span>
                          <span className="font-medium">
                            {walletT('labels.nftCount', { count: balance.RWLK })}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  <AddCstToMetaMaskButton variant="drawer" />

                  <div className="space-y-1.5 px-5 py-2">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-white/40">
                      {walletT('labels.anchoredHeading')}
                    </p>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {walletT('balances.anchoredCst')}
                      </span>
                      <span className="font-medium text-primary">
                        {anchoredCSTokens == null
                          ? null
                          : walletT('labels.nftCount', {
                              count: anchoredCSTokens.length,
                            })}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {walletT('balances.anchoredRwlk')}
                      </span>
                      <span className="font-medium text-primary">
                        {anchoredRWLKTokens == null
                          ? null
                          : walletT('labels.nftCount', {
                              count: anchoredRWLKTokens.length,
                            })}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <div className="pb-6" />
            </DrawerList>
          </SheetContent>
        </Sheet>
      </nav>
    );
  };

  return (
    <AppBarWrapper>
      <div className="mx-auto w-full max-w-7xl px-4">
        {systemMode > 0 && (
          <div className="fixed left-0 right-0 top-[var(--header-height)] z-40 bg-amber-500/95 px-6 py-2.5 text-black backdrop-blur-sm">
            <div className="mx-auto max-w-7xl flex items-center justify-between gap-4">
              <p className="text-sm">
                {systemMode === 1
                  ? t('maintenance.pendingMessage')
                  : t('maintenance.activeMessage')}
              </p>
              <span className="shrink-0 rounded-full bg-black/10 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                {systemMode === 1 ? t('maintenance.pendingLabel') : t('maintenance.activeLabel')}
              </span>
            </div>
          </div>
        )}

        {mobileView ? renderMobile() : renderDesktop()}
      </div>
    </AppBarWrapper>
  );
};

export default Header;
