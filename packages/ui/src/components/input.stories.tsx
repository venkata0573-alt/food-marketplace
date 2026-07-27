import type { Meta, StoryObj } from '@storybook/react';

import { InputField } from './input';

const meta: Meta<typeof InputField> = {
  title: 'Primitives/InputField',
  component: InputField,
  args: { label: 'Email', name: 'email', type: 'email' },
};

export default meta;

type Story = StoryObj<typeof InputField>;

export const Default: Story = {};
export const WithHint: Story = { args: { hint: <span>We never share your email.</span> } };
export const WithError: Story = { args: { error: 'Enter a valid email address' } };
export const Disabled: Story = { args: { disabled: true, value: 'chef@example.com' } };
