import { extensionDriverTrino } from './extension-driver-trino';

describe('extensionDriverTrino', () => {
  it('should work', () => {
    expect(extensionDriverTrino()).toEqual('extension-driver-trino');
  });
});
