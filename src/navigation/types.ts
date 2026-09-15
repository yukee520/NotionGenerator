import type { NavigatorScreenParams } from '@react-navigation/native';
import type { MarketingChannel } from '@/types/marketing';
import type { ID } from '@/types/common';

export type TabParamList = {
  Dashboard: undefined;
  PainPoints: undefined;
  Ideas: undefined;
  Templates: undefined;
  Marketing: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<TabParamList>;
  PainPointForm: { id?: ID } | undefined;
  PainPointDetail: { id: ID };
  IdeaDetail: { id: ID };
  BuildStatus: { templateId: ID };
  TemplateDetail: { id: ID };
  TemplateTest: { id: ID };
  Guide: { id: ID };
  Pricing: { id: ID };
  Listing: { id: ID };
  MarketingList: { templateId?: ID } | undefined;
  MarketingDetail: { templateId: ID; channel: MarketingChannel };
  Published: undefined;
  Settings: undefined;
  About: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}