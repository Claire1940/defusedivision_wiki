import {
	Gift,
	Trophy,
	Crosshair,
	MessageCircle,
	BookOpen,
	SlidersHorizontal,
	Shirt,
	Sword,
	type LucideIcon,
} from 'lucide-react'

export interface NavigationItem {
	key: string // 用于翻译键，如 'codes' -> t('nav.codes')
	path: string // URL 路径，如 '/codes'
	icon: LucideIcon // Lucide 图标组件
	isContentType: boolean // 是否对应 content/ 目录
}

// Defuse Division 内容导航分类（与 content/<locale>/ 目录一一对应）
// 顺序按 SEO 意图排列：兑换码 → 攻略 → 武器 → 皮肤 → 准星 → 设置 → 竞技 → Discord 社群
export const NAVIGATION_CONFIG: NavigationItem[] = [
	{ key: 'codes', path: '/codes', icon: Gift, isContentType: true },
	{ key: 'guide', path: '/guide', icon: BookOpen, isContentType: true },
	{ key: 'weapons', path: '/weapons', icon: Sword, isContentType: true },
	{ key: 'skins', path: '/skins', icon: Shirt, isContentType: true },
	{ key: 'crosshair', path: '/crosshair', icon: Crosshair, isContentType: true },
	{ key: 'settings', path: '/settings', icon: SlidersHorizontal, isContentType: true },
	{ key: 'competitive', path: '/competitive', icon: Trophy, isContentType: true },
	{ key: 'discord', path: '/discord', icon: MessageCircle, isContentType: true },
]

// 从配置派生内容类型列表（用于路由和内容加载）
export const CONTENT_TYPES = NAVIGATION_CONFIG.filter((item) => item.isContentType).map(
	(item) => item.path.slice(1),
) // 移除开头的 '/'

export type ContentType = (typeof CONTENT_TYPES)[number]

// 辅助函数：验证内容类型
export function isValidContentType(type: string): type is ContentType {
	return CONTENT_TYPES.includes(type as ContentType)
}
