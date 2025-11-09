export enum ProjectType {
  SPONSORED_POST = 'SPONSORED_POST',
  PRODUCT_REVIEW = 'PRODUCT_REVIEW',
  BRAND_AMBASSADOR = 'BRAND_AMBASSADOR',
  EVENT_COVERAGE = 'EVENT_COVERAGE',
  TUTORIAL_VIDEO = 'TUTORIAL_VIDEO',
  UNBOXING = 'UNBOXING',
  GIVEAWAY = 'GIVEAWAY',
  COLLABORATION = 'COLLABORATION',
  STORE_VISIT = 'STORE_VISIT',
  OTHER = 'OTHER',
}

export enum ProjectStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export const projectTypeLabels: Record<ProjectType, { en: string; ja: string }> = {
  [ProjectType.SPONSORED_POST]: {
    en: 'Sponsored Post',
    ja: 'スポンサード投稿',
  },
  [ProjectType.PRODUCT_REVIEW]: {
    en: 'Product Review',
    ja: '商品レビュー',
  },
  [ProjectType.BRAND_AMBASSADOR]: {
    en: 'Brand Ambassador',
    ja: 'ブランドアンバサダー',
  },
  [ProjectType.EVENT_COVERAGE]: {
    en: 'Event Coverage',
    ja: 'イベント取材',
  },
  [ProjectType.TUTORIAL_VIDEO]: {
    en: 'Tutorial Video',
    ja: 'チュートリアル動画',
  },
  [ProjectType.UNBOXING]: {
    en: 'Unboxing',
    ja: '開封動画',
  },
  [ProjectType.GIVEAWAY]: {
    en: 'Giveaway',
    ja: 'プレゼント企画',
  },
  [ProjectType.COLLABORATION]: {
    en: 'Collaboration',
    ja: 'コラボレーション',
  },
  [ProjectType.STORE_VISIT]: {
    en: 'Store Visit',
    ja: '店舗訪問',
  },
  [ProjectType.OTHER]: {
    en: 'Other',
    ja: 'その他',
  },
};

export const projectStatusLabels: Record<ProjectStatus, { en: string; ja: string }> = {
  [ProjectStatus.PENDING]: {
    en: 'Pending',
    ja: '保留中',
  },
  [ProjectStatus.ACCEPTED]: {
    en: 'Accepted',
    ja: '承認済み',
  },
  [ProjectStatus.REJECTED]: {
    en: 'Rejected',
    ja: '却下',
  },
  [ProjectStatus.IN_PROGRESS]: {
    en: 'In Progress',
    ja: '進行中',
  },
  [ProjectStatus.COMPLETED]: {
    en: 'Completed',
    ja: '完了',
  },
  [ProjectStatus.CANCELLED]: {
    en: 'Cancelled',
    ja: 'キャンセル',
  },
};

export const projectStatusColors: Record<ProjectStatus, string> = {
  [ProjectStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [ProjectStatus.ACCEPTED]: 'bg-green-100 text-green-800 border-green-200',
  [ProjectStatus.REJECTED]: 'bg-red-100 text-red-800 border-red-200',
  [ProjectStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800 border-blue-200',
  [ProjectStatus.COMPLETED]: 'bg-purple-100 text-purple-800 border-purple-200',
  [ProjectStatus.CANCELLED]: 'bg-gray-100 text-gray-800 border-gray-200',
};
