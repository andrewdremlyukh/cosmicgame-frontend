import { cstRewardFacts, isV3Mechanics, protocolFacts } from '@/content/protocol-facts';

import { COSMIC_SIGNATURE_MARKETPLACE_URL } from '@/config/marketplace';
import { CHAOS_ZERO_PREDICTIONS_URL } from '@/config/predictions';
import { CST_UNISWAP_SWAP_URL } from '@/config/uniswap';
import { APP_ORIGIN, LANDING_ORIGIN } from '@/lib/hostRouting';

import type { LearnArticle, LearnContent, LearnSection } from './types';

const appLink = (path: string) => `${APP_ORIGIN}${path}`;

const baseLearnArticles: LearnArticle[] = [
  {
    slug: 'what-is-cosmic-signature',
    title: '什么是 Cosmic Signature？ · Cosmic Signature',
    description:
      'Cosmic Signature 是运行于 Arbitrum 的程序化链上艺术协议；参与者在演绎周期中落笔，共同塑造确定性的三体 NFT 作品。',
    h1: '什么是 Cosmic Signature？',
    updated: '2026-06-24',
    schemaType: 'Article',
    summary:
      'Cosmic Signature 是运行于 Arbitrum 的程序化链上艺术协议。参与者在演绎周期中落笔，每一笔都会写入链上记录，共同塑造由链上数据生成的确定性 Cosmic Signature NFT 作品。',
    sections: [
      {
        heading: '简明定义',
        body: [
          'Cosmic Signature 将链上参与、确定性艺术生成与协议分配融为一体。协议运行于 Arbitrum——以太坊 Layer 2 网络，重要操作和记录都可在链上查验。',
          '每个演绎周期都会汇集一系列落笔。周期收官后，最终签名将铭刻为 NFT 作品，周期储备则按协议规则发放至各条分配轨道，其中包括当前转拨给 Protocol Guild 的公共物品分配。',
        ],
      },
      {
        heading: '名称为何重要',
        body: [
          '名称中的 Signature，指每个周期最终生成的作品。每一笔都会改变周期状态，并随最终签名一同写入协议历史。',
          'Cosmic Signature 与生物学中的 COSMIC 癌症突变数据库或 COSMIC 突变特征无关。它专注于确定性三体 NFT 艺术，是一套链上艺术协议。',
        ],
      },
    ],
    related: [
      { label: '打开 Cosmic Signature 应用', href: APP_ORIGIN },
      { label: '阅读常见问题', href: appLink('/faq') },
      { label: '查看协议统计', href: appLink('/statistics') },
    ],
  },
  {
    slug: 'how-the-performance-cycle-works',
    title: 'Cosmic Signature 演绎周期如何运作 · Cosmic Signature',
    description:
      '了解 Cosmic Signature 的演绎周期如何在 Arbitrum 上展开，包括校准窗口、落笔、收官和分配轨道。',
    h1: 'Cosmic Signature 演绎周期如何运作',
    updated: '2026-06-24',
    schemaType: 'TechArticle',
    summary:
      'Cosmic Signature 的演绎周期是一段开放期：落笔在此汇集，时间机制随之变化，最终签名由此诞生，各项分配则由链上规则确定。',
    sections: [
      {
        heading: '周期开启',
        body: [
          `周期以首个 ETH 校准窗口为起点。CST 校准窗口的初始时长为 ${protocolFacts.initialCstCalibrationWindowHours} 小时，之后会随每次落笔在链上动态调整。`,
          `首笔落笔会启动收官倒计时。此后每一笔都会按当前增量延长倒计时，并更新周期状态。ETH 落笔会使 CST 校准窗口缩短约 ${protocolFacts.cstCalibrationWindowDecreasePercentPerEthGesture}%；CST 落笔则会使其延长约 ${protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture}%。`,
        ],
      },
      {
        heading: '周期收官',
        body: [
          '收官倒计时结束后，写下收官之笔的参与者可以收官。专属窗口结束后，公开收官将向所有人开放。',
          '收官会铭刻周期结果、更新协议历史，并将周期储备发放至签名分配、锚定派发、星选和公共物品分配等轨道。',
        ],
      },
    ],
    related: [
      { label: '查看当前演绎周期', href: appLink('/current-cycle') },
      { label: '查看分配记录', href: appLink('/allocation') },
      { label: '阅读协议常见问题', href: appLink('/faq') },
    ],
  },
  {
    slug: 'how-gestures-work',
    title: 'Cosmic Signature 的落笔如何运作 · Cosmic Signature',
    description:
      '了解 ETH 落笔、CST 落笔、落笔价格与参与 CST，以及每一笔如何塑造 Cosmic Signature 演绎周期。',
    h1: 'Cosmic Signature 的落笔如何运作',
    updated: '2026-06-24',
    schemaType: 'Article',
    summary:
      '落笔是 Cosmic Signature 中的链上参与操作，可使用 ETH 或 CST。每一笔都会改变当前演绎周期。',
    sections: [
      {
        heading: '落笔会带来什么',
        body: [
          `每一笔都会写入当前周期，可能铭刻参与 CST，延长收官倒计时，并成为最终签名历史的一部分。参与 CST 的数量按${isV3Mechanics ? '线性' : '平方根'}公式计算：${cstRewardFacts.formula}。`,
          `落笔价格会在周期中持续变化。ETH 落笔与 CST 落笔彼此关联，但各有机制；校准窗口会清楚显示价格如何变化。每笔 CST 落笔会使 CST 校准窗口延长约 ${protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture}%；每笔 ETH 落笔则会使其缩短约 ${protocolFacts.cstCalibrationWindowDecreasePercentPerEthGesture}%。`,
        ],
      },
      {
        heading: '附加 Random Walk NFT',
        body: [
          '参与者可在 ETH 落笔时附加一枚未使用的 Random Walk NFT，以获得一次落笔价格减免。Random Walk NFT 也可锚定，从而取得锚定 NFT 星选资格。',
          '即使不连接钱包，也能在公共页面查看这些机制和相关记录。',
        ],
      },
    ],
    related: [
      { label: '在应用中落笔或查看落笔记录', href: APP_ORIGIN },
      {
        label: '了解演绎周期',
        href: `${LANDING_ORIGIN}/learn/how-the-performance-cycle-works`,
      },
      { label: '查看当前周期数据', href: appLink('/current-cycle') },
    ],
  },
  {
    slug: 'three-body-nft-art',
    title: 'Cosmic Signature 如何生成三体 NFT 艺术 · Cosmic Signature',
    description: '从技术层面了解 Cosmic Signature 如何以链上种子与三体物理生成确定性的 NFT 作品。',
    h1: 'Cosmic Signature 如何生成三体 NFT 艺术',
    updated: '2026-06-24',
    schemaType: 'TechArticle',
    summary: 'Cosmic Signature NFT 以链上种子为输入，通过可复现的三体物理渲染管线生成确定性作品。',
    sections: [
      {
        heading: '从链上种子到确定性渲染',
        body: [
          '每枚 Cosmic Signature NFT 都保存着可复现作品的种子。渲染管线采用确定性输入，因此同一种子始终生成相同的签名作品。',
          '创作过程模拟 3 个天体在牛顿引力下的运动。混沌轨迹化作光谱般的轨道痕迹，由此形成协议鲜明的视觉语言。',
        ],
      },
      {
        heading: '开放且可复现',
        body: [
          '可复现性是这套协议的重要原则。借助源代码和渲染管线，任何人都能从种子出发，独立验证每件签名作品。',
          '作品与相关技术均以 CC0 发布，任何人都可自由使用和改编。',
        ],
      },
    ],
    related: [
      { label: '浏览 Cosmic Signature 画廊', href: appLink('/gallery') },
      { label: '查看源代码', href: appLink('/code') },
      { label: '阅读合约与验证说明', href: appLink('/contracts') },
    ],
  },
  {
    slug: 'cosmic-signature-on-arbitrum',
    title: '运行于 Arbitrum 的 Cosmic Signature · Cosmic Signature',
    description:
      '了解 Cosmic Signature 为何运行于 Arbitrum，以及协议如何借助以太坊 Layer 2 基础设施承载链上艺术。',
    h1: '运行于 Arbitrum 的 Cosmic Signature',
    updated: '2026-06-24',
    schemaType: 'Article',
    summary:
      'Cosmic Signature 运行于 Arbitrum，让落笔、周期、NFT 记录与分配都能在以太坊 Layer 2 网络上完成。',
    sections: [
      {
        heading: '为何选择 Arbitrum',
        body: [
          'Arbitrum 在承接以太坊安全性的同时，提供成本更低的执行环境。参与者可能反复落笔并查阅公开状态，因此这一点对协议尤为重要。',
          '应用、合约、统计和画廊都会明确标注 Arbitrum，方便核对协议所在的网络。',
        ],
      },
    ],
    related: [
      { label: '查看已验证合约', href: appLink('/contracts') },
      { label: '查看协议统计', href: appLink('/statistics') },
    ],
  },
  {
    slug: 'contracts-security-verification',
    title: 'Cosmic Signature 合约、安全与验证 · Cosmic Signature',
    description:
      '查阅 Cosmic Signature 智能合约、源代码、验证信息，以及这套 Arbitrum 协议的安全背景。',
    h1: 'Cosmic Signature 合约、安全与验证',
    updated: '2026-06-24',
    schemaType: 'TechArticle',
    summary: 'Cosmic Signature 公开合约与源代码信息，便于参与者审视协议机制并验证链上行为。',
    sections: [
      {
        heading: '公开的合约信息',
        body: [
          '合约页面是查询地址、验证链接、部署详情和协议资金流向的官方入口。',
          '关键信息会以清晰文字列出，无需连接钱包或打开区块浏览器也能查阅。',
        ],
      },
    ],
    related: [
      { label: '查看合约地址', href: appLink('/contracts') },
      { label: '打开源代码资源', href: appLink('/code') },
      { label: '阅读常见问题', href: appLink('/faq') },
    ],
  },
  {
    slug: 'cst-token-and-cosmic-council',
    title: 'CST 与宇宙议会 · Cosmic Signature',
    description: '了解 CST 代币与落笔、协议协调和宇宙议会之间的关系。',
    h1: 'CST 与宇宙议会',
    updated: '2026-06-24',
    schemaType: 'Article',
    summary:
      'CST 是 Cosmic Signature 的 ERC-20 代币。参与落笔时可能铭刻 CST；在宇宙议会中，CST 也可用于协调协议。',
    sections: [
      {
        heading: 'CST 在协议中的作用',
        body: [
          '落笔时可能铭刻参与 CST；CST 也可用于落笔，其价格由专属校准窗口决定。用于落笔的 CST 会直接销毁，永久从供应量中移除，不会汇入资金池。',
          isV3Mechanics
            ? '参与 CST 的数量会动态变化：它随距上一笔的时间线性累积。间隔越久，铭刻量按比例越大；连续快速落笔则铭刻量接近 0 CST。'
            : '参与 CST 的数量会动态变化：它取决于距上一笔的时间，并采用平方根公式。间隔越久，铭刻量通常越大；连续快速落笔则可能铭刻 0 CST。',
          '完成委托后，CST 可在宇宙议会中用作协调权重；持有者也可将权重委托给自己。参与者依照链上规则协调协议变更。',
        ],
      },
    ],
    related: [
      { label: '了解落笔如何运作', href: `${LANDING_ORIGIN}/learn/how-gestures-work` },
      { label: '打开应用', href: APP_ORIGIN },
    ],
  },
  {
    slug: 'anchoring-nfts',
    title: '锚定 Cosmic Signature NFT · Cosmic Signature',
    description:
      '了解 Cosmic Signature NFT 的锚定机制、ETH 锚定派发，以及 Random Walk NFT 的参与资格。',
    h1: '锚定 Cosmic Signature NFT',
    updated: '2026-05-25',
    schemaType: 'Article',
    summary:
      '锚定后，Cosmic Signature NFT 可参与 ETH 锚定派发，Random Walk NFT 则可获得锚定 NFT 星选资格。',
    sections: [
      {
        heading: '锚定派发',
        body: [
          'Cosmic Signature NFT 可锚定至协议。锚定后，它们会按协议规则参与该周期的 ETH 锚定派发；累积的 ETH 可在解锚时取回。',
          'Random Walk NFT 的锚定用途不同：锚定后可获得锚定 NFT 星选资格，但不会参与 ETH 锚定派发。',
          '无论 Cosmic Signature 还是 Random Walk，每枚 NFT 都只能锚定一次。解锚时可取回 NFT 和累积的锚定派发，但此后无法再次锚定这枚 NFT。',
        ],
      },
    ],
    related: [
      { label: '打开锚定工具', href: appLink('/anchoring') },
      { label: '浏览画廊', href: appLink('/gallery') },
    ],
  },
  {
    slug: 'protocol-guild-public-goods',
    title: 'Cosmic Signature 与以太坊公共物品 · Cosmic Signature',
    description:
      '了解 Cosmic Signature 如何将公共物品分配转拨至 Protocol Guild，为以太坊核心贡献者提供资助。',
    h1: 'Cosmic Signature 与以太坊公共物品',
    updated: '2026-05-25',
    schemaType: 'Article',
    summary:
      'Cosmic Signature 设有公共物品分配轨道，目前会将每个周期的一部分储备转拨给 Protocol Guild。',
    sections: [
      {
        heading: 'Protocol Guild 分配',
        body: [
          'Protocol Guild 为 170 多位以太坊核心贡献者提供资助。Cosmic Signature 目前将公共物品分配转拨至 Protocol Guild。',
          '这说明公共物品分配是协议设计的一部分，而不是应用界面中的附带说明。',
        ],
      },
    ],
    related: [
      {
        label: '查看公共物品资助记录',
        href: appLink('/public-goods-contributions-cg'),
      },
      {
        label: '了解周期如何运作',
        href: `${LANDING_ORIGIN}/learn/how-the-performance-cycle-works`,
      },
    ],
  },
  {
    slug: 'collecting-and-trading-cosmic-signature',
    title: '收藏与交易 Cosmic Signature NFT 和 CST · Cosmic Signature',
    description:
      '了解 Cosmic Signature 资产可在哪里交易：Axiom Zero NFT 市场不收平台费，可在 Arbitrum 上通过 Uniswap 兑换 CST，Chaos Zero 则提供周期预测市场。',
    h1: '收藏与交易 Cosmic Signature',
    updated: '2026-07-06',
    schemaType: 'Article',
    summary:
      'Cosmic Signature NFT 可在 Axiom Zero 交易。该市场专注于 Arbitrum 上公平发布的生成艺术，不收平台费。CST 可在 Uniswap 交易；Chaos Zero 则为每个演绎周期开设预测市场。',
    sections: [
      {
        heading: '资产在哪里交易',
        body: [
          'Cosmic Signature NFT 是 Arbitrum 上的标准 ERC-721 代币，主要在 Axiom Zero 交易。Axiom Zero 专注于采用公平发布机制的生成艺术，不收平台费；每次挂单或成交都通过单笔链上交易完成，卖方收到全部成交金额。市场收录 Cosmic Signature 和 Random Walk 两个 Axiom Zero 系列，页面价格均直接来自已验证的市场合约。',
          'CST 是标准的 ERC-20 代币，可在 Arbitrum 上通过 Uniswap 交易。两类资产都采用开放代币标准，因此任何支持 ERC-721 或 ERC-20 的 Arbitrum 市场或兑换平台都可处理。交易前，务必以官方合约页面核对地址。',
        ],
      },
      {
        heading: 'Chaos Zero 预测市场',
        body: [
          'Chaos Zero 是专为 Cosmic Signature 构建的预测市场。每个演绎周期只问一件事：这一周期收官时，落笔次数是否会超过上一周期？预测凭证以 CST 计价，并在机制上由 CST 全额覆盖——每单位 CST 始终可拆分为一枚 YES 代币和一枚 NO 代币，一对匹配的代币也始终可兑换回一单位 CST。',
          '市场根据公开的链上落笔次数判定结果。一旦次数超过上一周期总数，结果便已确定；交易会在同一区块停止，此后只能取回相应资产。Chaos Zero 没有所有者、管理密钥或升级路径。',
        ],
      },
    ],
    related: [
      { label: '在 Axiom Zero 浏览 Cosmic Signature', href: COSMIC_SIGNATURE_MARKETPLACE_URL },
      { label: '在 Chaos Zero 研判周期结果', href: CHAOS_ZERO_PREDICTIONS_URL },
      { label: '在 Uniswap 用 ETH 兑换 CST', href: CST_UNISWAP_SWAP_URL },
      { label: '核验合约地址', href: appLink('/contracts') },
      { label: '浏览 NFT 画廊', href: appLink('/gallery') },
    ],
  },
  // lexicon-allow-start: 保留明确的否认措辞。
  {
    slug: 'not-a-lottery-not-an-investment',
    title: 'Cosmic Signature 是彩票、赌场或投资产品吗？ · Cosmic Signature',
    description: 'Cosmic Signature 是程序化链上艺术协议，不是彩票、赌场、赌博产品或投资产品。',
    h1: 'Cosmic Signature 是彩票、赌场或投资产品吗？',
    updated: '2026-05-25',
    schemaType: 'Article',
    summary: 'Cosmic Signature 是程序化链上艺术协议。它不是彩票、赌场、赌博产品或投资产品。',
    sections: [
      {
        heading: '直接说明',
        body: [
          '参与者在演绎周期中落笔。周期收官后，协议会按既定轨道发放分配。这里没有庄家，没有荷官，也没有赌注。',
          'CST 在协议中体现参与和协调权重。它不代表股权、利润分成、股息或投资合同。Cosmic Signature 不对代币价格或未来市场走势作任何陈述。',
        ],
      },
    ],
    related: [
      { label: '阅读服务条款', href: appLink('/terms') },
      { label: '阅读常见问题', href: appLink('/faq') },
    ],
  },
  // lexicon-allow-end
];

const articleDepthSections: Record<string, readonly LearnSection[]> = {
  'what-is-cosmic-signature': [
    {
      heading: '协议有何独特之处',
      body: [
        'Cosmic Signature 不只是画廊或智能合约界面。它以演绎周期串联公开链上操作、确定性视觉输出和分配机制。每个周期的最终签名都来自公开的共同参与，而非一次孤立的铭刻操作。',
        '理解协议，可以从当前周期、最终签名、CST、锚定、宇宙议会和公共物品分配这些核心概念入手。所有记录都可回溯至 Arbitrum。',
      ],
    },
    {
      heading: '如何阅读公开数据',
      body: [
        '无需连接钱包，也能在应用中查看当前周期、统计、分配名录、合约地址、画廊和资助记录。',
        '品牌站负责解释机制与术语，应用站提供实时状态。两者相互链接，方便读者从概念说明前往链上记录。',
      ],
    },
  ],
  'how-the-performance-cycle-works': [
    {
      heading: '为何以周期为核心单位',
      body: [
        '演绎周期让 Cosmic Signature 形成反复展开的公共节奏。每一笔都归入具体周期；每个周期都有开启状态、实时倒计时、当前价格、参与记录、收官窗口和分配结果。',
        '这种结构便于验证。周期尚在推进时，读者可查看当前状态；待其收官后，再回来比对分配记录、画廊作品与统计。周期编号由此成为连接实时参与和历史记录的桥梁。',
      ],
    },
    {
      heading: '周期中会发生哪些变化',
      body: [
        '随着周期推进，落笔价格、收官倒计时、参与 CST 的数量、公共物品记录和领先状态都可能变化。当前周期、统计、分配名录和协调变更等页面会同步呈现这些记录。',
        '周期收官后，相关状态会归入历史。最终签名、获配记录、分配取回、已附加 NFT 和公共物品资助也会进入公开档案，供后续查阅。',
      ],
    },
  ],
  'how-gestures-work': [
    {
      heading: '落笔是公开信号',
      body: [
        '落笔是公开的链上操作，记录参与者与当前周期的互动，也会影响这一周期的最终签名。无论使用 ETH 还是 CST，每一笔都会写入周期记录。',
        '每笔记录都可追溯到参与者地址和发生时间，并显示参与 CST、附加 NFT、周期延长及后续分配等信息。',
      ],
    },
    {
      heading: 'ETH、CST 与 Random Walk NFT 的关系',
      body: [
        'ETH 落笔与 CST 落笔相互关联，但承担不同作用。ETH 落笔会汇入周期储备，CST 落笔则通过协议代币表达参与。应用会清楚标注两条路径，让参与者知道当前使用哪种资产，以及它将如何改变周期。',
        '附加 Random Walk NFT 也会写入公开记录。未使用的 Random Walk NFT 可在 ETH 落笔时附加，以获得一次价格减免；已使用的 NFT 会单独标记，方便事后核对。',
      ],
    },
  ],
  'three-body-nft-art': [
    {
      heading: '确定性为何对艺术重要',
      body: [
        '三体系统以运动、引力与不稳定轨迹构成 Cosmic Signature 的视觉语言。确定性至关重要，因为作品必须能从公开输入复现，而不依赖不透明的托管渲染器。',
        '确定性管线让收藏者、开发者和研究者能够验证签名图像是否与种子及渲染代码一致。源代码、画廊、代币详情和合约页面也能相互印证。',
      ],
    },
    {
      heading: '从周期历史到视觉身份',
      body: [
        '最终签名不是随意添加的装饰。它是演绎周期的视觉终点，周期历史则赋予图像文化与协议含义。作品由此成为一段公开过程完成后的可见印记。',
        '艺术作品是协议的一部分，不是脱离协议存在的媒体藏品。周期、代币、画廊、渲染管线和公开元数据都指向同一 Cosmic Signature 协议。',
      ],
    },
  ],
  'cosmic-signature-on-arbitrum': [
    {
      heading: '为何要明确标注网络',
      body: [
        'Cosmic Signature 在应用各处明确标注 Arbitrum，因为网络本就是协议身份的一部分。落笔、周期记录、合约地址、CST、NFT 所有权与分配取回，都需要指向具体网络，才能独立查验。',
        '合约与统计页面把机制说明连接到链上记录：读者可以先了解协议，再核验实际数据。',
      ],
    },
    {
      heading: '应用页面如何连接 Arbitrum 记录',
      body: [
        '应用页面会将原始链上记录和 API 数据整理成易读信息。分配页面说明获配者与周期结果，锚定页面说明代币状态，公共物品页面说明资助与取回流向，画廊则呈现代币作品。',
        '无需连接钱包或加载完整交互界面，也能了解 Arbitrum 上的协议活动。',
      ],
    },
  ],
  'contracts-security-verification': [
    {
      heading: '可供验证的公开入口',
      body: [
        '验证信息分布在多个公开入口。合约页面列出部署地址与区块浏览器链接，源代码页面介绍确定性渲染资源，审计页面说明审阅状态，安全页面则解释如何查验官方资源。',
        '核验时应结合这些页面：合约地址需与部署说明一同查看，安全声明也应有报告或链接作为依据。站内链接会串联合约地址、源代码、风险说明和审计状态。',
      ],
    },
    {
      heading: '应先核对什么',
      body: [
        '先在官方应用主站打开合约页面，确认网络为 Arbitrum；再逐一对照源代码链接、安全概览与审计页面。如尚未发布审计或形式化验证报告，页面会明确标注当前状态。',
        '已部署事实、已发布报告、静态分析、社区审阅和后续工作各有不同，不能混为一谈。',
      ],
    },
  ],
  'cst-token-and-cosmic-council': [
    {
      heading: 'CST 如何连接参与与协调',
      body: [
        'CST 用于协议参与和协调。参与者可通过落笔铭刻 CST，也可使用 CST 落笔；完成委托后，CST 则对应宇宙议会中的协调权重。CST 是协议代币，不代表股权。',
        '在应用中，CST 可用于落笔、委托权重和协调协议。相关页面只说明其协议用途，不暗示价格走势。',
      ],
    },
    {
      heading: '协调记录',
      body: [
        '宇宙议会让 CST 持有者依照链上规则协调协议变更。协调变更及相关应用页面会公开参数变更历史，帮助读者理解协议如何演进。',
        '为避免相关措辞引发歧义，Cosmic Signature 将这套协调机制称为"宇宙议会"，并将法律说明与风险披露单独呈现。',
      ],
    },
  ],
  'anchoring-nfts': [
    {
      heading: '锚定公开了什么',
      body: [
        '无论是刚完成铭刻，还是从其他地址获得，持有者都可将 NFT 锚定至协议。公开锚定页面会展示锚定与解锚操作、已锚定代币数量、派发记录，以及相关的 Random Walk NFT 活动。',
        '锚定是公开的协议机制。无需连接钱包，也能查看已锚定代币数量和派发记录。',
      ],
    },
    {
      heading: 'Cosmic Signature 与 Random Walk NFT 的不同作用',
      body: [
        'Cosmic Signature NFT 锚定后可参与 ETH 锚定派发；Random Walk NFT 锚定后则获得锚定 NFT 星选资格。未使用的 Random Walk NFT 还可在 ETH 落笔时附加一次，以减免落笔价格。',
        '页面会清楚标注代币类型，并链接至统计、画廊和当前周期页面，方便核对相关记录。',
      ],
    },
  ],
  'protocol-guild-public-goods': [
    {
      heading: '公共物品为何属于协议本身',
      body: [
        '公共物品转拨是协议内的一条固定分配轨道。按现行规则，周期储备的一部分会转至公共物品受益方，目前为 Protocol Guild。',
        '公共物品页面会列出资助、取回和受益方记录，方便核验资金流向及其与周期参与的关系。',
      ],
    },
    {
      heading: '如何核验公共物品流向',
      body: [
        '公共物品资助页面记录存入金额，取回页面记录从金库转拨的资金；合约页面提供地址，统计页面则给出汇总背景。',
        'Cosmic Signature 仅说明公开记录中的资金流向，不对税务处理或法律地位作任何暗示。',
      ],
    },
  ],
  'collecting-and-trading-cosmic-signature': [
    {
      heading: '锚定状态如何影响收藏',
      body: [
        '除了作品本身，锚定还为 Cosmic Signature 与 Random Walk NFT 增加了一项会影响收藏判断的链上状态。每枚 NFT 一生仅可锚定至协议一次，解锚后便永久失去这项资格。尚未锚定的 NFT 仍保留唯一一次锚定机会，收藏者通常会关注这一点。',
        'Axiom Zero 会从锚定合约实时读取状态，将每枚代币标为从未锚定或已锚定；每个系列内也可按该状态筛选代币。这样一来，市场中的代币说明便与应用展示的链上锚定记录保持一致。',
      ],
    },
    {
      heading: '如何核验交易场所与地址',
      body: [
        '交易前，先在应用主站的合约页面确认官方地址，再与市场中的系列地址或兑换平台上的代币地址逐一比对。应用页眉、页脚与网站地图均提供 Axiom Zero、Chaos Zero 和 Uniswap 的官方链接，因此始终可以循着官方导航抵达正确地址。',
        '兑换 CST 与持有预测凭证时也应同样谨慎：核对代币地址是否与已公布的 CST 合约一致。Chaos Zero 会根据协议记录的公开落笔次数判定预测结果，因此市场的每项输入都可在 Arbitrum 上独立查验。',
      ],
    },
  ],
  // lexicon-allow-start: 保留明确的否认措辞。
  'not-a-lottery-not-an-investment': [
    {
      heading: '为何明确否认',
      body: [
        '本页直接说明 Cosmic Signature 不属于彩票、赌场、赌博或投资产品，避免读者误解协议性质。',
        '理解 Cosmic Signature，首先要看它是什么：程序化链上艺术协议。参与者落笔，周期收官，确定性作品完成铭刻，分配按公开规则发放。',
      ],
    },
    {
      heading: '如何理解分配措辞',
      body: [
        '这里所说的分配，是指周期收官后由协议按规则发放的资产，不代表利润分成、股息权、股权或任何承诺的财务回报。参与前，请阅读风险披露和服务条款。',
        '说明内容与钱包操作分开呈现。无需连接钱包，也能阅读协议定义和否认说明。',
      ],
    },
  ],
  // lexicon-allow-end
};

const answerabilitySections: LearnSection[] = [
  {
    heading: '查阅最新信息',
    body: [
      '实时周期数据、已验证合约地址、源代码和统计均可在官方应用中查阅。',
      '会随时间变化的信息，请以应用中的实时数据为准；协议机制则以学习中心、常见问题、服务条款、安全、审计和风险披露页面为准。',
    ],
  },
];

export const learnContentZh = {
  hub: {
    meta: {
      title: '了解 Cosmic Signature · 链上艺术、演绎周期与 Arbitrum',
      description:
        '了解 Cosmic Signature 的运作原理：演绎周期、落笔、CST、三体 NFT 艺术、Arbitrum 合约、锚定、公共物品与风险释疑。',
    },
    eyebrow: 'Cosmic Signature 学习中心',
    h1: '了解 Cosmic Signature',
    intro:
      '这里汇集了一组简明指南，带你读懂 Cosmic Signature。这套程序化链上艺术协议运行于 Arbitrum；参与者在演绎周期中落笔，共同塑造确定性的三体 NFT 艺术。',
    breadcrumbs: {
      homeLabel: 'Cosmic Signature',
      learnLabel: '学习中心',
    },
  },
  articleUi: {
    eyebrow: 'Cosmic Signature 学习中心',
    breadcrumbs: {
      ariaLabel: '面包屑导航',
      homeLabel: 'Cosmic Signature',
      learnLabel: '学习中心',
    },
    lastUpdatedLabel: '最后更新：',
    publisherLabel: '由 Cosmic Signature 发布',
    relatedResourcesHeading: 'Cosmic Signature 相关资源',
  },
  articles: baseLearnArticles.map((article) => ({
    ...article,
    sections: [
      ...article.sections,
      ...(articleDepthSections[article.slug] ?? []),
      ...answerabilitySections,
    ],
  })),
} satisfies LearnContent;
