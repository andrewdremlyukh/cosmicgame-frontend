import {
  cstRewardFacts,
  ethDistributionFacts,
  isV3Mechanics,
  nftAllocationFacts,
  protocolFacts,
} from '@/content/protocol-facts';

import { HOW_IT_WORKS_PATH, type HowItWorksContent } from './types';

export const howItWorksContentZh = {
  metadata: {
    title: 'Cosmic Signature 运作原理 · 演绎周期、落笔与 NFT',
    description:
      '了解 Cosmic Signature 演绎周期如何展开：从校准窗口到一次次落笔，再到收官后的分配发放。',
    path: HOW_IT_WORKS_PATH,
  },
  jsonLd: {
    name: 'Cosmic Signature 运作原理',
    description:
      '了解 Cosmic Signature 演绎周期如何展开：从校准窗口到一次次落笔，再到收官后的分配发放。',
  },
  breadcrumbs: {
    homeLabel: '首页',
    pageLabel: '运作原理',
  },
  hero: {
    badge: '程序化链上艺术协议',
    headingLead: 'Cosmic Signature',
    headingAccent: '运作原理',
    paragraph:
      '落笔，坚守，塑造签名。参与者在演绎周期中落笔；收官倒计时归零后，周期即可收官，储备将沿十余条分配轨道发放——签名分配、锚定派发与 Protocol Guild 都在其中。',
    primaryCta: { label: '进入协议', href: '/' },
    secondaryCta: { label: '了解更多', href: '#protocol-overview' },
  },
  overview: {
    heading: '运作原理',
    subhead: '三步参与，共同塑造周期储备。',
    cards: [
      {
        number: '01',
        title: '落笔',
        description:
          '使用 ETH 或 CST（ERC-20）落笔。每一笔都会延长收官倒计时，计入一次星选资格，并继续塑造这一周期的签名。',
        tooltip: `落笔可使用 ETH 或 CST 代币（ERC-20）。在 ETH 落笔时附加一枚 Random Walk NFT，可获得一次性 ${protocolFacts.randomWalkDiscountPercentage}% 的 ETH 落笔价格减免。`,
      },
      {
        number: '02',
        title: '坚守',
        description:
          '周期会持续推进，直至收官倒计时归零；每有新落笔，倒计时都会按当前时间增量延长。',
        tooltip:
          '时间增量最初约为 1 小时，并随周期缓慢增长。CST 落笔价格采用动态校准窗口，ETH 与 CST 落笔会使窗口朝相反方向变化。',
      },
      {
        number: '03',
        title: '获配',
        description: '周期收官后，即可参与各项分配——签名分配、星选、锚定派发等。',
        tooltip: `写下收官之笔的参与者会获得周期储备的 ${ethDistributionFacts.mainEthPercentage}%、${protocolFacts.specialAllocationCst.toLocaleString('zh-CN')} CST 与 ${nftAllocationFacts.mainPrizeNftPhrase.zh}。星选获配者、锚定者及其他参与者也会获得相应分配。`,
      },
    ],
  },
  rewardBreakdown: {
    heading: '每一笔会铭刻什么',
    subhead: '每个周期，参与都会在多条分配轨道留下铭刻。',
    items: [
      {
        title: '动态参与 CST',
        description: '每一笔都可能铭刻 CST，数量取决于距上一笔经过的时间。',
        tooltip: `参与 CST 采用${isV3Mechanics ? '线性' : '平方根'}公式：${cstRewardFacts.formula}。连续快速落笔可能铭刻 0 CST；沉寂越久，铭刻量越大。`,
      },
      {
        title: '星选资格',
        description: '每一笔都会计入一次星选资格，参与周期收官时的分配。',
        tooltip: `周期收官后，协议会从星选资格中程序化随机选出获配者：3 位参与者均分周期储备中 ${ethDistributionFacts.stellarSelectionEthPercentage}% 的 ETH。`,
      },
      {
        title: 'Cosmic Signature NFT 星选',
        description: `每个周期，都有 10 位参与者经星选获配 ${protocolFacts.specialAllocationCst.toLocaleString('zh-CN')} CST 与 1 枚独一无二的 Cosmic Signature NFT。`,
        tooltip: `每个周期，10 位星选获配者与 10 位 Random Walk NFT 锚定者，每位都会获配 ${protocolFacts.specialAllocationCst.toLocaleString('zh-CN')} CST 与 1 枚 Cosmic Signature NFT。`,
      },
      {
        title: '签名分配',
        description: `写下收官之笔的参与者，可取回周期储备中 ${ethDistributionFacts.mainEthPercentage}% 的 ETH、${protocolFacts.specialAllocationCst.toLocaleString('zh-CN')} CST 与 ${nftAllocationFacts.mainPrizeNftPhrase.zh}。`,
        tooltip: '周期储备随每一笔增长。写下收官之笔的参与者通过协议合约取回签名分配。',
      },
    ],
  },
  gameCycle: {
    heading: '演绎周期的完整历程',
    subhead: '从开启到收官，每个周期都沿同一顺序展开。',
    phases: [
      {
        label: '周期开启',
        description: `新的演绎周期由此开始。首个 ETH 校准窗口随之开启；CST 校准窗口从 ${protocolFacts.initialCstCalibrationWindowHours} 小时的基准出发，之后随参与不断变化。`,
        tooltip:
          '在校准窗口内，落笔价格会逐步回落，参与者可自行选择落笔时机。周期储备的起点，是上一周期滚入的滚动储备。',
      },
      {
        label: '参与者落笔',
        description: isV3Mechanics
          ? '每一笔都会按当前时间增量延长收官倒计时。参与 CST 动态变化；每笔 CST 落笔会以其成交价的两倍重启 CST 校准窗口，之后价格按恒定速率下降。'
          : `每一笔都会按当前时间增量延长收官倒计时。参与 CST 动态变化；ETH 落笔会使 CST 校准窗口缩短约 ${protocolFacts.cstCalibrationWindowDecreasePercentPerEthGesture}%，CST 落笔则使其延长约 ${protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture}%。`,
        tooltip: isV3Mechanics
          ? '参与 CST 随距上一笔经过的时间线性累积。确切数量以应用中的实时预览为准。'
          : '参与 CST 按平方根公式计算，取决于距上一笔经过的时间。确切数量以应用中的实时预览为准。',
      },
      {
        label: '收官倒计时归零',
        description: '倒计时归零后，写下收官之笔的参与者随即取得收官资格。',
        tooltip: `收官真正执行前，仍可继续落笔——迟来的一笔会再次延长倒计时，并成为新的收官之笔。写下收官之笔的参与者拥有 ${protocolFacts.finalGestureExclusivityHours} 小时的专属收官窗口；窗口结束后，任何人都可收官并获得签名分配。`,
      },
      {
        label: '周期收官',
        description: `写下收官之笔的参与者取回签名分配：周期储备的 ${ethDistributionFacts.mainEthPercentage}%、${protocolFacts.specialAllocationCst.toLocaleString('zh-CN')} CST 与 ${nftAllocationFacts.mainPrizeNftPhrase.zh}。`,
        tooltip: '签名分配经由协议合约取回；CST 与 Cosmic Signature NFT 会自动完成铭刻。',
      },
      {
        label: '星选',
        description: `3 位 ETH 星选获配者均分周期储备的 ${ethDistributionFacts.stellarSelectionEthPercentage}%；参与者 NFT 星选与锚定 NFT 星选各选出 10 位获配者，每位获配 ${protocolFacts.specialAllocationCst.toLocaleString('zh-CN')} CST 与 1 枚 Cosmic Signature NFT。`,
        tooltip:
          '星选资格随每一笔计入；落笔越多，入选频次越高。Random Walk NFT 锚定者另有单独的星选。',
      },
      {
        label: '下一周期',
        description: '约一半周期储备会作为滚动储备滚入下一周期，新周期则以全新的校准窗口开启。',
        tooltip:
          '滚动储备意味着协议滚动累积，而非抽取。当前窗口时长与落笔价格，以实时合约数据为准。',
      },
    ],
  },
  stepByStep: {
    heading: '快速上手',
    subhead: '从连接钱包到落下第一笔，只需三步。',
    stepLabel: '步骤',
    steps: [
      {
        title: '连接钱包',
        tooltip: 'Arbitrum 是以太坊上的 Layer 2 区块链，Gas 费更低，交易更快。',
        highlights: [
          '点击页面顶部的“连接钱包”按钮。',
          '使用支持 Arbitrum 的钱包，例如 MetaMask。',
          '按提示将网络切换至 Arbitrum，并确认相关授权。',
          '连接完成后，钱包地址会显示在页面顶部。',
        ],
      },
      {
        title: '查看落笔价格',
        tooltip: 'Arbitrum 上的 Gas 费通常只有几美分，远低于以太坊主网。',
        highlights: [
          '查看周期收官时间——每一笔都会按当前时间增量将其延长。',
          '落笔前，先确认当前的 ETH 或 CST 落笔价格。',
          '查看参与 CST 的实时预览；数量会随距上一笔的时间长短而变化。',
          '留意签名分配金额，了解这一周期潜在的 ETH 分配。',
          '确保钱包中除落笔价格外，还留有少量 ETH 用作 Gas 费。',
        ],
      },
      {
        title: '落下第一笔',
        tooltip: `每枚 Random Walk NFT 仅可使用一次，用于 ${protocolFacts.randomWalkDiscountPercentage}% 的 ETH 落笔价格减免——不妨留到合适的时机。`,
        highlights: [
          `选择 ETH 落笔，并可附加一枚 Random Walk NFT 获得 ${protocolFacts.randomWalkDiscountPercentage}% 的 ETH 落笔价格减免；也可使用 CST（ERC-20）落笔。`,
          '点击“落笔”，然后在钱包中确认交易。',
          '这一笔会延长收官倒计时，并更新 ETH 与 CST 的价格状态。',
          '每一笔都会计入一次星选资格，还可能自动铭刻动态的参与 CST。',
        ],
      },
    ],
  },
  proTips: {
    heading: '进阶技巧与策略',
    subhead: '实用建议，帮助你在各条分配轨道上更充分地参与。',
    tips: [
      {
        title: '同时关注两个校准窗口',
        description: 'ETH 与 CST 落笔价格各有实时窗口；每一笔都会改变 CST 窗口。',
        tooltip:
          'ETH 落笔会略微缩短 CST 校准窗口，CST 落笔则会略微将其延长。当前价格走势可在应用面板中实时查看。',
      },
      {
        title: '附加 Random Walk NFT',
        description: `持有 Random Walk NFT，可获得一次性 ${protocolFacts.randomWalkDiscountPercentage}% 的 ETH 落笔价格减免。`,
        tooltip: '每枚 Random Walk NFT 仅可用于一次价格减免。留到落笔价格较高时使用，效果更佳。',
      },
      {
        title: '积累星选资格',
        description: '每一笔都会计入一次星选资格；落笔越多，入选频次越高。',
        tooltip: `3 位 ETH 星选获配者均分周期储备的 ${ethDistributionFacts.stellarSelectionEthPercentage}%；10 位参与者 NFT 获配者与 10 位 Random Walk NFT 锚定者，每位获配 ${protocolFacts.specialAllocationCst.toLocaleString('zh-CN')} CST 与 1 枚 Cosmic Signature NFT。`,
      },
      {
        title: '使用专用钱包',
        description: '智能合约的源代码已在链上公开验证；使用专用钱包参与，还能再添一层保障。',
        tooltip: '专用钱包将协议操作与主要资产隔离，安全性更高。审计与验证状态可在审计页面查看。',
      },
      {
        title: '留意收官倒计时',
        description: '每一笔都会按当前时间增量延长链上记录的周期收官时间。',
        tooltip: '临近归零时落笔，你距离收官之笔最近；但在周期收官前，其他参与者仍可在你之后落笔。',
      },
      {
        title: '使用 CST 落笔',
        description: 'CST 也可用于落笔，价格由专属的 CST 校准窗口决定。',
        tooltip: isV3Mechanics
          ? 'CST 落笔同样会计入一次星选资格、延长收官倒计时，还可能铭刻动态的参与 CST，并以其成交价的两倍重启 CST 校准窗口。'
          : `CST 落笔同样会计入一次星选资格、延长收官倒计时，还可能铭刻动态的参与 CST，并使 CST 校准窗口延长约 ${protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture}%。`,
      },
    ],
  },
  faqCallout: {
    heading: '还有疑问？',
    body: '关于周期机制、分配轨道、代币，以及 Cosmic Signature 的方方面面，常见问题页都有详细解答。',
    cta: { label: '浏览常见问题', href: '/faq' },
  },
  callToAction: {
    heading: '准备落下第一笔了吗？',
    body: '加入正在推进的演绎周期。连接钱包，落下你的第一笔，开始铭刻 CST，塑造这一周期的签名。',
    primaryCta: { label: '进入协议', href: '/' },
    discordCta: {
      label: 'Discord',
      href: 'https://discord.com/channels/1258032742084509779/1258691600951935056',
    },
    twitterCta: { label: 'Twitter / X', href: 'https://x.com/CosmicSignature' },
  },
} as const satisfies HowItWorksContent;
