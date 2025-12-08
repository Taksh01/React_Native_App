describe('Smoke Test', () => {
  it('should pass if Jest is set up correctly', () => {
    expect(true).toBe(true);
  });

  it('should be able to import React', () => {
    const React = require('react');
    expect(React).toBeTruthy();
  });
});
