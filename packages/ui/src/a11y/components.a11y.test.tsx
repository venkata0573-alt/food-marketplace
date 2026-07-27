import { render } from '@testing-library/react';
import { axe } from 'vitest-axe';
import 'vitest-axe/extend-expect';
import { describe, expect, it } from 'vitest';

import { Button } from '../components/button';
import { InputField } from '../components/input';

describe('UI accessibility (axe)', () => {
  it('Button primary has no violations', async () => {
    const { container } = render(<Button>Checkout</Button>);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('InputField default has no violations', async () => {
    const { container } = render(<InputField label="Quantity" name="qty" type="number" />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
