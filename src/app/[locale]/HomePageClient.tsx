"use client";

import { useState, Suspense, lazy } from "react";
import {
  ArrowRight,
  BookOpen,
  Bomb,
  Check,
  ChevronDown,
  Coins,
  Copy,
  Crosshair,
  Gift,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useMessages } from "next-intl";
import { VideoFeature } from "@/components/home/VideoFeature";
import { LatestGuidesAccordion } from "@/components/home/LatestGuidesAccordion";
import { NativeBannerAd, AdBanner } from "@/components/ads";
import { getPreferredMobileBannerSelection } from "@/components/ads/mobileAdConfigs";
// import { SidebarAd } from "@/components/ads/SidebarAd"; // 废弃广告位，禁止重新接回
import { scrollToSection } from "@/lib/scrollToSection";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import type { ContentItemWithType } from "@/lib/getLatestArticles";
import type { ModuleLinkMap } from "@/lib/buildModuleLinkMap";

// Lazy load heavy components
const HeroStats = lazy(() => import("@/components/home/HeroStats"));
const FAQSection = lazy(() => import("@/components/home/FAQSection"));
const CTASection = lazy(() => import("@/components/home/CTASection"));

// Loading placeholder
const LoadingPlaceholder = ({ height = "h-64" }: { height?: string }) => (
  <div
    className={`${height} bg-white/5 border border-border rounded-xl animate-pulse`}
  />
);

interface HomePageClientProps {
  latestArticles: ContentItemWithType[];
  moduleLinkMap: ModuleLinkMap;
  locale: string;
}

// Defuse Division 模块按主题色透明度梯度区分层级（无硬编码颜色）
const TIER_BADGE_STYLES: Record<string, string> = {
  S: "bg-[hsl(var(--nav-theme))] text-black",
  A: "bg-[hsl(var(--nav-theme)/0.25)] text-[hsl(var(--nav-theme-light))] border border-[hsl(var(--nav-theme)/0.5)]",
  B: "bg-[hsl(var(--nav-theme)/0.15)] text-[hsl(var(--nav-theme-light))] border border-[hsl(var(--nav-theme)/0.3)]",
  C: "bg-white/5 text-muted-foreground border border-border",
};

// 模块导航卡片 -> section 锚点 1:1 映射
const TOOL_SECTION_IDS = [
  "defuse-division-codes",
  "beginner-guide",
  "tier-list",
  "game-mechanics",
];

// 游戏机制手风琴 topic -> 图标 映射（每项不同图标）
const MECHANIC_ICONS = [Crosshair, Bomb, Target, Users, Coins];

export default function HomePageClient({
  latestArticles,
  moduleLinkMap,
  locale,
}: HomePageClientProps) {
  const t = useMessages() as any;
  // 模块标题为静态文案，不再消费 moduleLinkMap；保留入参以维持 page.tsx 调用签名
  void moduleLinkMap;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.defusedivision.wiki";

  // Structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Defuse Division Wiki",
        description:
          "Community Defuse Division Wiki covering maps, weapons, skins, economy, movement, and competitive tactics for the Roblox tactical bomb-defusal shooter by Fourteam.",
        image: {
          "@type": "ImageObject",
          url: `${siteUrl}/images/hero.webp`,
          width: 1920,
          height: 1080,
          caption: "Defuse Division - Roblox Tactical Bomb-Defusal Shooter",
        },
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "Defuse Division Wiki",
        alternateName: "Defuse Division",
        url: siteUrl,
        description:
          "Community Defuse Division Wiki resource hub for maps, weapons, skins, economy, movement, and competitive tactics",
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/android-chrome-512x512.png`,
          width: 512,
          height: 512,
        },
        image: {
          "@type": "ImageObject",
          url: `${siteUrl}/images/hero.webp`,
          width: 1920,
          height: 1080,
          caption: "Defuse Division Wiki - Roblox Tactical Bomb-Defusal Shooter",
        },
        sameAs: [
          "https://www.roblox.com/games/112757576021097/Defuse-Division",
          "https://www.roblox.com/groups/5628426/Fourteam",
          "https://devforum.roblox.com/t/defuse-division-changelog/4003992/1",
        ],
      },
      {
        "@type": "VideoGame",
        name: "Defuse Division",
        gamePlatform: ["Roblox", "PC", "Mac"],
        applicationCategory: "Game",
        genre: ["Tactical FPS", "Shooter", "Bomb-Defusal", "Competitive"],
        numberOfPlayers: {
          minValue: 1,
          maxValue: 14,
        },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          availability: "https://schema.org/InStock",
          url: "https://www.roblox.com/games/112757576021097/Defuse-Division",
        },
      },
      {
        "@type": "VideoObject",
        name: "Defuse Division Gameplay",
        description:
          "Defuse Division gameplay — a 4.4k CS2 player demonstrating the Roblox tactical bomb-defusal shooter.",
        uploadDate: "2025-11-01",
        thumbnailUrl: `${siteUrl}/images/hero.webp`,
        embedUrl: "https://www.youtube.com/embed/YV_uFnjJw8Q",
        url: "https://www.youtube.com/watch?v=YV_uFnjJw8Q",
      },
    ],
  };

  // 模块内交互状态
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [mechanicOpen, setMechanicOpen] = useState<number | null>(0);
  const mobileBannerAd = getPreferredMobileBannerSelection();

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => {
        setCopiedCode((cur) => (cur === code ? null : cur));
      }, 1500);
    } catch {
      // 剪贴板不可用时静默失败，用户仍可手动选中复制
    }
  };

  return (
    <div className="home-shell min-h-screen bg-background text-foreground">
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* 广告位 1: 顶部固定横幅 */}
      <div className="sticky top-20 z-20 border-b border-border py-2">
        <AdBanner type="banner-320x50" adKey={process.env.NEXT_PUBLIC_AD_MOBILE_320X50} />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pt-24 pb-14 md:pt-32 md:pb-20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-8 scroll-reveal">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 md:px-4 md:py-2
                            bg-[hsl(var(--nav-theme)/0.1)]
                            border border-[hsl(var(--nav-theme)/0.3)] mb-4 md:mb-6"
            >
              <Sparkles className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
              <span className="text-xs md:text-sm font-medium">
                {t.hero.badge}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 md:mb-6 leading-[1.05]">
              {t.hero.title}
            </h1>

            {/* Description */}
            <p className="mx-auto mb-8 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg md:mb-10 md:max-w-3xl md:text-2xl">
              {t.hero.description}
            </p>

            {/* CTA Buttons */}
            <div className="mb-10 flex flex-col justify-center gap-3 sm:flex-row md:mb-12 md:gap-4">
              <button
                onClick={() => scrollToSection("defuse-division-codes")}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 md:px-8 md:py-4
                           bg-[hsl(var(--nav-theme))] hover:bg-[hsl(var(--nav-theme)/0.9)]
                           text-white rounded-lg font-semibold text-base md:text-lg transition-colors"
              >
                <Gift className="w-5 h-5" />
                {t.hero.getFreeCodesCTA}
              </button>
              <a
                href="https://www.roblox.com/games/112757576021097/Defuse-Division"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 md:px-8 md:py-4
                           border border-border hover:bg-white/10 rounded-lg
                           font-semibold text-base md:text-lg transition-colors"
              >
                {t.hero.playOnRobloxCTA}
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Stats */}
          <Suspense fallback={<LoadingPlaceholder height="h-32" />}>
            <HeroStats stats={Object.values(t.hero.stats)} />
          </Suspense>
        </div>
      </section>

      {/* Video Section - 紧跟 Hero，max-w-5xl 避免挤压广告展示空间 */}
      <section className="px-4 py-10 md:py-12">
        <div className="scroll-reveal container mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-2xl">
            <VideoFeature
              videoId="YV_uFnjJw8Q"
              title="Defuse Division Gameplay"
            />
          </div>
        </div>
      </section>

      {/* Tools Grid - 模块导航区（视频区之后、Latest Updates 之前） */}
      <section className="px-4 py-14 md:py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.tools.title}{" "}
              <span className="text-[hsl(var(--nav-theme-light))]">
                {t.tools.titleHighlight}
              </span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              {t.tools.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {t.tools.cards.map((card: any, index: number) => {
              const sectionId = TOOL_SECTION_IDS[index];
              return (
                <button
                  key={index}
                  onClick={() => scrollToSection(sectionId)}
                  className="scroll-reveal group rounded-xl border border-border p-4 md:p-6
                             bg-card hover:border-[hsl(var(--nav-theme)/0.5)]
                             transition-all duration-300 cursor-pointer text-left
                             hover:shadow-lg hover:shadow-[hsl(var(--nav-theme)/0.1)]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div
                    className="mb-3 h-10 w-10 rounded-lg md:mb-4 md:h-12 md:w-12
                                  bg-[hsl(var(--nav-theme)/0.1)]
                                  flex items-center justify-center
                                  group-hover:bg-[hsl(var(--nav-theme)/0.2)]
                                  transition-colors"
                  >
                    <DynamicIcon
                      name={card.icon}
                      className="h-5 w-5 md:h-6 md:w-6 text-[hsl(var(--nav-theme-light))]"
                    />
                  </div>
                  <h3 className="mb-1.5 text-sm md:text-base font-semibold leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    {card.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Latest Updates Section - 保留模板原生模块 */}
      <LatestGuidesAccordion
        articles={latestArticles}
        locale={locale}
        max={12}
      />

      {/* 广告位 2: 首屏内容之后再加载广告 */}
      <NativeBannerAd adKey={process.env.NEXT_PUBLIC_AD_NATIVE_BANNER || ""} />

      {/* 广告位 3: 移动端优先使用方形，桌面端保留横幅 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-728x90"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90}
        className="hidden md:flex"
      />

      {/* Module 1: Defuse Division Codes */}
      <section id="defuse-division-codes" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <div className="inline-flex items-center gap-2 mb-3 md:mb-4">
              <Gift className="w-6 h-6 text-[hsl(var(--nav-theme-light))]" />
              <h2 className="text-3xl md:text-5xl font-bold">
                {t.modules.defuseDivisionCodes.title}
              </h2>
            </div>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {t.modules.defuseDivisionCodes.intro}
            </p>
          </div>

          {/* 兑换码卡片 */}
          <div className="scroll-reveal grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 md:mb-10">
            {t.modules.defuseDivisionCodes.codes.map((c: any, index: number) => {
              const copied = copiedCode === c.code;
              return (
                <div
                  key={index}
                  className="p-5 md:p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <code className="px-3 py-1.5 rounded-md bg-[hsl(var(--nav-theme)/0.12)] border border-[hsl(var(--nav-theme)/0.3)] text-[hsl(var(--nav-theme-light))] font-mono text-sm md:text-base font-semibold tracking-wide">
                      {c.code}
                    </code>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full bg-[hsl(var(--nav-theme)/0.15)] border border-[hsl(var(--nav-theme)/0.35)] text-[hsl(var(--nav-theme-light))] font-medium whitespace-nowrap"
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="text-sm md:text-base text-foreground/90 mb-4">
                    {c.reward}
                  </p>
                  <button
                    onClick={() => handleCopyCode(c.code)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-white/5 hover:bg-[hsl(var(--nav-theme)/0.15)] hover:border-[hsl(var(--nav-theme)/0.5)] text-xs md:text-sm font-medium transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))]" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy Code
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* 兑换步骤 */}
          <div className="scroll-reveal p-5 md:p-6 bg-[hsl(var(--nav-theme)/0.05)] border border-[hsl(var(--nav-theme)/0.3)] rounded-xl">
            <div className="flex items-center gap-2 mb-4">
              <Check className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
              <h3 className="font-bold text-base md:text-lg">How to Redeem Defuse Division Codes</h3>
            </div>
            <ol className="space-y-3">
              {t.modules.defuseDivisionCodes.redeemSteps.map((step: string, index: number) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[hsl(var(--nav-theme)/0.2)] border border-[hsl(var(--nav-theme)/0.4)] text-xs font-bold text-[hsl(var(--nav-theme-light))]">
                    {index + 1}
                  </span>
                  <span className="text-sm md:text-base text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 广告位 4: 第一模块之后的阅读停顿位 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-468x60"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_468X60}
        className="hidden md:flex"
      />

      {/* Module 2: Defuse Division Beginner Guide */}
      <section id="beginner-guide" className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <h2 className="text-3xl md:text-5xl font-bold mb-3 md:mb-4">
              {t.modules.defuseDivisionBeginnerGuide.title}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {t.modules.defuseDivisionBeginnerGuide.intro}
            </p>
          </div>

          {/* 步骤 */}
          <div className="scroll-reveal space-y-3 md:space-y-4 mb-8 md:mb-10">
            {t.modules.defuseDivisionBeginnerGuide.steps.map((step: any, index: number) => (
              <div
                key={index}
                className="flex gap-3 md:gap-4 p-4 md:p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
              >
                <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-full border-2 border-[hsl(var(--nav-theme)/0.5)] bg-[hsl(var(--nav-theme)/0.2)]">
                  <span className="text-base md:text-xl font-bold text-[hsl(var(--nav-theme-light))]">
                    {index + 1}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold mb-1.5 md:mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 快速提示 */}
          <div className="scroll-reveal p-4 md:p-6 bg-[hsl(var(--nav-theme)/0.05)] border border-[hsl(var(--nav-theme)/0.3)] rounded-xl">
            <div className="flex items-center gap-2 mb-3 md:mb-4">
              <BookOpen className="w-5 h-5 text-[hsl(var(--nav-theme-light))]" />
              <h3 className="font-bold text-base md:text-lg">Quick Tips</h3>
            </div>
            <ul className="space-y-2">
              {t.modules.defuseDivisionBeginnerGuide.quickTips.map((tip: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[hsl(var(--nav-theme-light))] mt-1 flex-shrink-0" />
                  <span className="text-muted-foreground text-sm">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Module 3: Defuse Division Tier List */}
      <section id="tier-list" className="scroll-mt-24 px-4 py-14 md:py-20">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <div className="inline-flex items-center gap-2 mb-3 md:mb-4">
              <Trophy className="w-6 h-6 text-[hsl(var(--nav-theme-light))]" />
              <h2 className="text-3xl md:text-5xl font-bold">
                {t.modules.defuseDivisionTierList.title}
              </h2>
            </div>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {t.modules.defuseDivisionTierList.intro}
            </p>
          </div>

          {/* 层级列表 */}
          <div className="scroll-reveal space-y-3 md:space-y-4">
            {t.modules.defuseDivisionTierList.tiers.map((tier: any, index: number) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 p-4 md:p-6 bg-white/5 border border-border rounded-xl hover:border-[hsl(var(--nav-theme)/0.5)] transition-colors"
              >
                <div className="flex items-center gap-3 sm:w-48 sm:flex-shrink-0">
                  <span
                    className={`flex h-12 w-12 md:h-14 md:w-14 flex-shrink-0 items-center justify-center rounded-xl text-xl md:text-2xl font-black ${TIER_BADGE_STYLES[tier.tier] || TIER_BADGE_STYLES.C}`}
                  >
                    {tier.tier}
                  </span>
                  <h3 className="font-bold text-base md:text-lg leading-tight">
                    {tier.label}
                  </h3>
                </div>
                <p className="text-sm md:text-base text-muted-foreground sm:flex-1">
                  {tier.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 广告位 5: 移动端横幅 */}
      {mobileBannerAd && (
        <AdBanner
          type={mobileBannerAd.type}
          adKey={mobileBannerAd.adKey}
          className="md:hidden"
        />
      )}

      {/* Module 4: Defuse Division Game Mechanics */}
      <section id="game-mechanics" className="scroll-mt-24 px-4 py-14 md:py-20 bg-white/[0.02]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8 md:mb-12 scroll-reveal">
            <div className="inline-flex items-center gap-2 mb-3 md:mb-4">
              <Crosshair className="w-6 h-6 text-[hsl(var(--nav-theme-light))]" />
              <h2 className="text-3xl md:text-5xl font-bold">
                {t.modules.defuseDivisionMechanics.title}
              </h2>
            </div>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              {t.modules.defuseDivisionMechanics.intro}
            </p>
          </div>

          {/* 手风琴 */}
          <div className="scroll-reveal space-y-3">
            {t.modules.defuseDivisionMechanics.items.map((item: any, index: number) => {
              const Icon = MECHANIC_ICONS[index % MECHANIC_ICONS.length];
              const isOpen = mechanicOpen === index;
              return (
                <div
                  key={index}
                  className="border border-border rounded-xl overflow-hidden bg-white/5"
                >
                  <button
                    onClick={() => setMechanicOpen(isOpen ? null : index)}
                    className="w-full flex items-center justify-between gap-3 p-4 md:p-5 text-left hover:bg-white/5 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="flex items-center gap-3 font-semibold text-sm md:text-base">
                      <span className="flex h-8 w-8 md:h-9 md:w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--nav-theme)/0.12)] border border-[hsl(var(--nav-theme)/0.3)]">
                        <Icon className="w-4 h-4 md:w-5 md:h-5 text-[hsl(var(--nav-theme-light))]" />
                      </span>
                      {item.topic}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 flex-shrink-0 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
                  >
                    <p className="px-4 md:px-5 pb-4 md:pb-5 pl-[3.75rem] md:pl-[4.25rem] text-sm md:text-base text-muted-foreground leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <FAQSection
          title={t.faq.title}
          titleHighlight={t.faq.titleHighlight}
          subtitle={t.faq.subtitle}
          questions={t.faq.questions}
        />
      </Suspense>

      {/* CTA Section */}
      <Suspense fallback={<LoadingPlaceholder />}>
        <CTASection
          title={t.cta.title}
          description={t.cta.description}
          joinCommunity={t.cta.joinCommunity}
          joinGame={t.cta.joinGame}
        />
      </Suspense>

      {/* Ad Banner 3 */}
      <AdBanner
        type="banner-300x250"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_300X250}
        className="md:hidden"
      />
      <AdBanner
        type="banner-728x90"
        adKey={process.env.NEXT_PUBLIC_AD_BANNER_728X90}
        className="hidden md:flex"
      />

      {/* Footer */}
      <footer className="bg-white/[0.02] border-t border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-[hsl(var(--nav-theme-light))]">
                {t.footer.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t.footer.description}
              </p>
            </div>

            {/* Community - External Links Only */}
            <div>
              <h4 className="font-semibold mb-4">{t.footer.community}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="https://discord.com/invite/defusedivision"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.discord}
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.reddit.com/r/DefuseDivision/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.reddit}
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.roblox.com/games/112757576021097/Defuse-Division"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.robloxGame}
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.roblox.com/groups/5628426/Fourteam"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.robloxGroup}
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal - Internal Routes Only */}
            <div>
              <h4 className="font-semibold mb-4">{t.footer.legal}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/about"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.about}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy-policy"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.privacy}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms-of-service"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.terms}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/copyright"
                    className="text-muted-foreground hover:text-[hsl(var(--nav-theme-light))] transition"
                  >
                    {t.footer.copyrightNotice}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Copyright */}
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {t.footer.copyright}
              </p>
              <p className="text-xs text-muted-foreground">
                {t.footer.disclaimer}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
