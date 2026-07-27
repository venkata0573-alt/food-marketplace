import type { Meta, StoryObj } from '@storybook/react';

import { Card } from './card';

const meta: Meta<typeof Card> = {
  title: 'Primitives/Card',
  component: Card,
  args: { heading: 'Chef profile', children: 'Content goes here.' },
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {};
export const WithoutTitle: Story = { args: { heading: undefined } };
