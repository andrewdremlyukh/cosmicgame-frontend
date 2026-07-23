import { isV3Mechanics, protocolFacts } from '@/content/protocol-facts';

import { CST_GECKOTERMINAL_POOL_URL } from '@/config/geckoterminal';
import { COSMIC_SIGNATURE_MARKETPLACE_URL } from '@/config/marketplace';
import { CHAOS_ZERO_PREDICTIONS_URL } from '@/config/predictions';
import { CST_UNISWAP_SWAP_URL } from '@/config/uniswap';
import { APP_ORIGIN } from '@/lib/hostRouting';

import type { LandingContent } from './types';

export const landingContentZh = {
  meta: {
    title: 'Cosmic Signature · Arbitrum 上的程序化链上艺术协议',
    description:
      'Cosmic Signature 是运行于 Arbitrum 的程序化链上艺术协议。每一笔都在塑造这一周期最终的签名；周期收官后，协议会将储备重新分配给共同塑造结果的参与者，并将其中一部分转拨给以太坊赖以运转的基础设施。',
    keywords: [
      'Cosmic Signature',
      '程序化艺术协议',
      '链上艺术',
      'Arbitrum',
      '三体问题',
      '生成艺术',
      '公共物品',
      'Protocol Guild',
      'CC0',
      '经形式化验证',
    ],
  },

  hero: {
    eyebrow: '程序化链上艺术协议 · Arbitrum',
    headline: 'Cosmic Signature：程序化链上艺术 · Arbitrum',
    headlineLead: 'Cosmic Signature：程序化链上艺术 ·',
    headlineAccent: 'Arbitrum',
    subhead:
      '每一笔，都在塑造签名。在演绎周期中落笔，你的每一笔都会融入这一周期最终的签名。周期收官后，储备会沿十余条轨道发放，其中一部分将流向以太坊基础设施。',
    biologyDisclaimer:
      'Cosmic Signature 与 COSMIC 癌症突变数据库及生物学中的 COSMIC 突变特征没有关联。本项目是链上艺术协议及应用。',
    primaryCta: { label: '打开应用', href: APP_ORIGIN },
    secondaryCta: { label: '探索周期', href: '#cycle' },
    statisticsCta: { label: '查看统计', href: `${APP_ORIGIN}/statistics` },
    galleryCta: { label: '浏览画廊', href: `${APP_ORIGIN}/gallery` },
    scrollAriaLabel: '滚动到周期介绍',
    marqueeChips: [
      '已验证合约',
      'CC0',
      '开源',
      '确定性艺术',
      '7% 转拨至 Protocol Guild',
      '宇宙议会',
      'Arbitrum One',
    ],
  },

  cycle: {
    eyebrow: '周期',
    heading: '从开启到收官，读懂完整的演绎周期。',
    // lexicon-allow-start: 明确否认庄家角色。
    description:
      '每个周期都从校准窗口开始，在一次次落笔中延展，直至收官倒计时归零。没有庄家，没有中介，只有协议本身。',
    // lexicon-allow-end
    stages: [
      {
        number: '01',
        title: '周期开启',
        body: `新的演绎周期由此开始。首个 ETH 校准窗口随之开启；CST 校准窗口的初始时长记录在链上，目前为 ${protocolFacts.initialCstCalibrationWindowHours} 小时。`,
      },
      {
        number: '02',
        title: '落笔',
        body: isV3Mechanics
          ? '参与者使用 ETH 或 CST 落笔。每一笔都会延长收官倒计时，计入一次星选资格，还可能铭刻参与 CST；具体数量随距上一笔经过的时间以恒定速率累积。每笔 CST 落笔会以其成交价的两倍重启 CST 校准窗口，之后价格按同一恒定速率下降。'
          : `参与者使用 ETH 或 CST 落笔。每一笔都会延长收官倒计时，计入一次星选资格，还可能铭刻参与 CST；具体数量取决于距上一笔经过的时间，并按其平方根计算。ETH 落笔会使 CST 校准窗口缩短约 ${protocolFacts.cstCalibrationWindowDecreasePercentPerEthGesture}%；CST 落笔则使其延长约 ${protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture}%。`,
      },
      {
        number: '03',
        title: '收官',
        body: '收官倒计时归零后，写下收官之笔的参与者可率先收官。专属窗口结束后，任何人都可在公开收官窗口收官。',
      },
      {
        number: '04',
        title: '分配',
        body: '协议将周期储备发放至十余条分配轨道。约一半 ETH 储备会滚入下一周期的滚动储备。',
      },
    ],
  },

  art: {
    eyebrow: '艺术',
    heading: '三体问题，链上渲染。',
    description:
      '每枚 Cosmic Signature NFT 都呈现 3 个天体在牛顿引力下的运动轨迹。三体运动天生混沌。没有 AI，没有训练数据，只有确定性的物理。同一种子生成的画面逐像素一致。',
    loading: {
      label: '实时档案同步中',
      description: '索引到代币元数据后，真实生成的 NFT 会随即在此呈现。',
    },
    showcase: {
      liveLabel: '实时签名',
      signalLabel: '信号',
      awaitingMetadataLabel: '等待元数据',
      viewAriaLabel: '查看 Cosmic Signature {tokenLabel}',
      artworkAlt: 'Cosmic Signature 作品 {tokenLabel}',
    },
    stageLabel: '阶段',
    stages: [
      {
        number: '01',
        title: '种子',
        body: '从链上数据——区块信息与 ArbSys 预编译——派生出 32 字节哈希，再送入 SHA3-256 RNG。',
      },
      {
        number: '02',
        title: '模拟',
        body: '十万组候选构型分别通过四阶 Yoshida 辛积分器演算，每组推进 1,000,000 个物理步。',
      },
      {
        number: '03',
        title: '筛选',
        body: 'Borda 排序聚合会综合混沌度与等边性，从候选池中选出视觉张力最强的一条轨道。',
      },
      {
        number: '04',
        title: '镜头',
        body: '镜头沿缓慢的椭圆轨迹漂移，为每幅签名作品中的三体之舞带来电影般的视差。',
      },
      {
        number: '05',
        title: '色彩',
        body: '色彩在 OKLab 感知色彩空间中混合，各天体色相相隔 120°，并由漂移与正弦波调制。',
      },
      {
        number: '06',
        title: '光谱渲染',
        body: '从 380 至 700 纳米划分 64 个波长区间，以随速度变化的线宽和景深渲染轨迹。',
      },
      {
        number: '07',
        title: '签名',
        body: 'AgX 色调映射、辉光、OpenSimplex 星云层与色彩分级共同完成画面。最终生成一张 16 位 PNG 与一段 30 秒 H.265 视频。',
      },
    ],
    facts: [
      { label: '波长区间', value: '64' },
      { label: '每组候选的物理步数', value: '1,000,000' },
      { label: '候选轨道', value: '100,000' },
      { label: '许可协议', value: 'CC0 1.0' },
    ],
  },

  tracks: {
    eyebrow: '分配轨道',
    heading: '十余条轨道，让周期储备循轨而行。',
    description:
      '周期收官后，协议会沿各条分配轨道发放 ETH 与 CST 储备，以表彰坚守、时机、投入与参与。约一半 ETH 储备会滚入下一周期。',
    cardLabel: '分配',
    items: [
      {
        percent: '25%',
        title: '签名分配',
        body: '写下收官之笔的参与者获配。其中包括 1,000 CST 与 1 枚 Cosmic Signature NFT。',
        tone: 'primary',
      },
      {
        percent: '约 50%',
        title: '滚动储备',
        body: '储备滚入下一演绎周期，继续累积；协议不从中抽取任何部分。',
        tone: 'aurora',
      },
      {
        percent: '8%',
        title: '时之勇士分配',
        body: `单次连续保持领先时间最长的参与者获配。其中包括 ${protocolFacts.specialAllocationCst.toLocaleString('zh-CN')} CST 与 1 枚 Cosmic Signature NFT。`,
        tone: 'rose',
      },
      {
        percent: '7%',
        title: '公共物品分配',
        body: '转拨给 Protocol Guild——为 170 多位以太坊核心贡献者提供资助的机制。',
        tone: 'impact',
      },
      {
        percent: '6%',
        title: '锚定派发',
        body: '按比例发放给本周期锚定至协议的所有 Cosmic Signature NFT。',
        tone: 'nebula',
      },
      {
        percent: '4%',
        title: 'ETH 星选',
        body: '由程序化随机选出的 3 位参与者均分；入选频次随落笔次数增加。',
        tone: 'solar',
      },
      {
        percent: '10 枚 NFT',
        title: '参与者 NFT 星选',
        body: `程序化随机选出 10 位参与者，每位获配 ${protocolFacts.specialAllocationCst.toLocaleString('zh-CN')} CST 与 1 枚 Cosmic Signature NFT。`,
        tone: 'default',
      },
      {
        percent: '10 枚 NFT',
        title: '锚定 NFT 星选',
        body: `程序化随机选出 10 位 Random Walk NFT 锚定者，每位获配 ${protocolFacts.specialAllocationCst.toLocaleString('zh-CN')} CST 与 1 枚 Cosmic Signature NFT。`,
        tone: 'default',
      },
      {
        percent: '1,000 CST',
        title: '坚守冠军分配',
        body: '连续坚守时间最长的参与者获配 1,000 表彰 CST 与 1 枚 Cosmic Signature NFT。',
        tone: 'default',
      },
      {
        percent: '1,000 CST',
        title: 'CST 收官之笔分配',
        body: '本周期最后一次使用 CST 落笔的参与者获配 1,000 表彰 CST 与 1 枚 Cosmic Signature NFT。',
        tone: 'default',
      },
    ],
  },

  anchoring: {
    eyebrow: '锚定',
    heading: '将 Cosmic Signature NFT 锚定至协议。',
    body: `每个周期，${protocolFacts.anchorDistributionPercentage}% 的 ETH 周期储备会用于锚定派发。已锚定的 Cosmic Signature NFT 会按比例累积相应份额，解锚时即可取回。每枚 NFT 仅可锚定一次，但可随时解锚；一旦解锚，便永久失去再次锚定的资格。已锚定的 Random Walk NFT 可获得锚定 NFT 星选资格；入选锚定者将获配 ${protocolFacts.specialAllocationCst.toLocaleString('zh-CN')} CST 与 1 枚 Cosmic Signature NFT（不含 ETH）。`,
    bullets: [
      '每个周期累积 ETH 锚定派发，解锚时取回',
      '可随时解锚；每枚 NFT 仅可锚定一次',
      '锚定 Random Walk NFT 可获得星选资格',
      '无固定期限、无罚则；每枚 NFT 解锚后不可再锚定',
    ],
    cta: { label: '前往应用锚定', href: `${APP_ORIGIN}/anchoring` },
  },

  publicGoods: {
    eyebrow: '公共物品',
    heading: `${protocolFacts.publicGoodsPercentage}% 的周期储备，流向以太坊核心贡献者。`,
    body: `每个演绎周期都会将 ETH 储备的 ${protocolFacts.publicGoodsPercentage}% 转拨给 Protocol Guild——为 170 多位以太坊核心贡献者提供资助的集体机制。协议使用得越多，流向以太坊底层基础设施的资源也越多。`,
    disclaimerHeading: '免责声明',
    // lexicon-allow-start: 明确否认慈善捐赠及相关税务定性。
    disclaimer:
      '这是向公共物品地址（目前为 Protocol Guild）转拨 ETH，并非美国税法意义上的慈善捐赠。Cosmic Signature 不对其税务处理作任何陈述。',
    // lexicon-allow-end
    card: {
      label: '周期分配',
      percentage: `${protocolFacts.publicGoodsPercentage}%`,
      description: '每个演绎周期都会将这部分储备转拨给 Protocol Guild。',
      tableRows: [
        { label: 'Protocol Guild 贡献者', value: '170+' },
        { label: '执行方式', value: '链上' },
        { label: '获配者', value: 'pg.eth' },
      ],
    },
    cta: { label: '了解 Protocol Guild', href: 'https://protocol-guild.readthedocs.io' },
  },

  council: {
    eyebrow: '宇宙议会',
    heading: '协议协调，尽在链上。',
    body: '宇宙议会让 CST 持有者在链上协调协议事务。持有者可将权重委托给自己或其他地址、提交协调提案，并对提案表示支持或反对。支持与弃权权重之和达到 CST 供应量的 3%，即达到协调法定权重要求。提交提案需至少 100 CST 的委托权重。',
    columns: [
      {
        title: '协调提案',
        body: '获委托权重不少于 100 CST 的地址均可提交提案。协调延迟为 2 天，协调期为 2 周。',
      },
      {
        title: '协调权重',
        body: '委托完成后，每单位 CST 对应一单位协调权重。支持、反对或弃权均通过密码学签名提交；CST 不代表股份，也不是股权工具。',
      },
      {
        title: '协调法定权重',
        body: '支持权重高于反对权重，且支持与弃权权重之和达到 CST 总供应量的 3%，提案即获通过。反对权重不计入法定权重。',
      },
    ],
  },

  verifiability: {
    eyebrow: '可验证性',
    heading: '开放、已验证、可复现。',
    body: '任何人都能从种子重新生成签名作品，独立完成验证。合约验证、静态分析说明和审计状态会随报告一同发布在应用中。本仓库中的项目自有材料采用 CC0 1.0；第三方依赖、字体与素材仍适用各自的许可证。',
    pillars: [
      {
        title: 'CC0 1.0',
        body: '项目自有的合约、着色器与渲染管线采用 CC0 1.0，不保留任何权利；第三方材料不在此范围内。',
      },
      {
        title: '验证状态',
        body: '应用提供公开合约地址、源代码资源、验证说明及审计与报告状态，任何人都能查看已发布内容。',
      },
      {
        title: '可复现艺术',
        body: '持续集成会校验生成画面的 SHA-256 哈希。同一种子，得到完全相同的输出。',
      },
    ],
  },

  faq: {
    eyebrow: '释疑',
    heading: '值得直面的问题。',
    items: [
      // lexicon-allow-start: 明确否认彩票、赌场、赌博、庄家、荷官及赌注类别。
      {
        question: '这是彩票、赌场或赌博产品吗？',
        answer:
          '不是。Cosmic Signature 是程序化链上艺术协议。参与者在演绎周期中落笔；周期收官后，协议将储备分配至十余条轨道。这里没有庄家，没有荷官，也没有赌注。分配所表彰的是坚守、时机与参与。唯一带有随机性的分配轨道——星选——是协议层面的程序化分配。',
      },
      // lexicon-allow-end
      {
        question: '参与者实际要做什么？',
        answer:
          '你可以落笔。每一笔都是使用 ETH 或 CST 发起的链上交易，会延长收官倒计时、计入一次星选资格，还可能铭刻参与 CST，并共同塑造这一周期的签名。你还可以将 Cosmic Signature NFT 锚定至协议，使其按比例参与锚定派发；持有至少 100 CST 时，也可以通过宇宙议会提交协调提案。',
      },
      {
        question: '为什么参与 CST 的数量会变化？',
        answer: isV3Mechanics
          ? `参与 CST 的铭刻量随距上一笔经过的时间线性累积——按协议上线参数约为每分钟 ${protocolFacts.v3.dynamicCstRewardPerMinuteAtLaunch} CST。沉寂越久，CST 铭刻量按比例越大；紧随他人之后落笔则铭刻量接近 0 CST。提交前，应用会预览当前数额。`
          : '参与 CST 的铭刻量采用平方根公式，取决于距上一笔经过的时间。沉寂越久，CST 铭刻量越大；平方根会让增幅逐渐放缓。落笔间隔极短时，可能铭刻 0 CST。提交前，应用会预览当前数额。',
      },
      {
        question: 'ETH 与 CST 落笔会怎样影响 CST 校准窗口？',
        answer: `CST 校准窗口保存在链上，每次落笔后都会变化。CST 落笔使窗口延长约 ${protocolFacts.cstCalibrationWindowIncreasePercentPerCstGesture}%，CST 落笔价格因而下降得更慢；ETH 落笔使窗口缩短约 ${protocolFacts.cstCalibrationWindowDecreasePercentPerEthGesture}%，价格下降得更快。`,
      },
      {
        question: 'ETH 分配来自哪里？',
        answer:
          '来自周期储备；参与者落笔时，储备随之增加。周期收官后，约一半滚入下一周期的滚动储备，其余则按照链上参数，经由各条分配轨道发放，包括签名分配、时之勇士、锚定派发、星选与公共物品。',
      },
      // lexicon-allow-start: 明确否认投资、利润、股息及投资合同定性。
      {
        question: '这属于投资吗？',
        answer:
          '不是。CST 代币用于表达协议内的参与和协调权重，不代表股权、利润分成、股息或投资合同。团队钱包不会从参与者的落笔中接收 ETH。Cosmic Signature 不对代币价格或未来表现作任何陈述，也不以投资名义招揽参与。',
      },
      // lexicon-allow-end
      // lexicon-allow-start: 明确否认慈善捐赠及相关税务定性。
      {
        question: '公共物品具体指什么？',
        answer:
          '每个周期会将 ETH 储备的 7% 转拨至公共物品地址，目前为 Protocol Guild。Protocol Guild 是为 170 多位以太坊核心贡献者提供资助的集体机制。这是向公共物品地址转拨 ETH，并非美国税法意义上的慈善捐赠；Cosmic Signature 不对其税务处理作任何陈述。',
      },
      // lexicon-allow-end
      {
        question: '这件艺术作品在技术上是什么？',
        answer:
          '每枚 Cosmic Signature NFT 都由确定性三体模拟渲染而成，模拟遵循牛顿引力。链上种子从 100,000 条候选轨道中选出一条；这些轨道均由四阶 Yoshida 辛积分器模拟，再通过 64 个波长区间进行光谱渲染，并以 OKLab 混合色彩。整套管线以 CC0 完全开源，任何人都能从种子复现签名作品。',
      },
      {
        question: '我可以自由复用或改编吗？',
        answer:
          '可以。项目自有的合约、着色器、渲染器、营销页面与文档均采用 CC0 1.0，不保留任何权利。第三方依赖、字体与素材仍适用各自的许可证；详见 THIRD_PARTY_NOTICES.md。',
      },
    ],
  },

  footer: {
    brandName: 'Cosmic Signature',
    logoAlt: 'Cosmic Signature',
    tagline: 'Arbitrum 上的程序化链上艺术协议。',
    columns: [
      {
        heading: '协议',
        links: [
          { label: '打开应用', href: APP_ORIGIN },
          { label: '关于', href: '/about' },
          { label: '学习', href: '/learn' },
          { label: '文档', href: `${APP_ORIGIN}/how-it-works` },
          { label: '合约', href: `${APP_ORIGIN}/contracts` },
          { label: '源代码', href: `${APP_ORIGIN}/code` },
        ],
      },
      {
        heading: '生态',
        links: [
          { label: 'Axiom Zero 市场', href: COSMIC_SIGNATURE_MARKETPLACE_URL },
          { label: 'Chaos Zero 预测', href: CHAOS_ZERO_PREDICTIONS_URL },
          { label: '在 Uniswap 交易 CST', href: CST_UNISWAP_SWAP_URL },
          { label: '在 GeckoTerminal 查看 CST 池', href: CST_GECKOTERMINAL_POOL_URL },
        ],
      },
      {
        heading: '社区',
        links: [
          { label: 'X / Twitter', href: 'https://x.com/CosmicSignature' },
          { label: 'Discord', href: 'https://discord.gg/bGnPn96Qwt' },
          { label: 'GitHub', href: 'https://github.com/PredictionExplorer' },
          { label: 'Protocol Guild', href: 'https://protocol-guild.readthedocs.io' },
        ],
      },
      {
        heading: '法律',
        links: [
          { label: '服务条款', href: `${APP_ORIGIN}/terms` },
          { label: '隐私政策', href: `${APP_ORIGIN}/privacy` },
          { label: '常见问题', href: '#faq' },
        ],
      },
    ],
    copyright: '© {year} Cosmic Signature。项目自有材料采用 CC0 1.0。',
    colophon: 'CC0 1.0 · 公开可验证 · 可复现艺术',
  },

  notFound: {
    code: '404',
    heading: '偏离星图。',
    description: '这个坐标已漂出协议疆界。返回签名，重新启程。',
    cta: { label: '返回签名', href: '/' },
  },
} as const satisfies LandingContent;
