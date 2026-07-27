import type { Meta, StoryObj } from '@storybook/react';

import { SkeletonStack } from './skeleton';

const meta: Meta<typeof SkeletonStack> = {
  title: 'Primitives/Skeleton',
  component: SkeletonStack,
};

export default meta;

type Story = StoryObj<typeof SkeletonStack>;

export const ThreeLines: Story = { args: { lines: 3 } };
export const SixLines: Story = { args: { lines: 6 } };
