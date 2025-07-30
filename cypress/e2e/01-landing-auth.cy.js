describe('LUXKIDS Platform - Landing and Authentication', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display the landing page correctly', () => {
    cy.get('h1').should('contain', 'LUXKIDS')
    cy.get('h2').should('contain', 'Suggestion Platform')
    cy.get('button').should('contain', 'Join LUXKIDS Platform')
    cy.get('a[href="https://luxkids.dk"]').should('exist')
  })

  it('should navigate to auth page from landing', () => {
    cy.get('button').contains('Join LUXKIDS Platform').click()
    cy.url().should('include', '/auth')
  })

  it('should show auth page with both sign in and sign up tabs', () => {
    cy.visit('/auth')
    cy.get('[data-value="signin"]').should('exist')
    cy.get('[data-value="signup"]').should('exist')
    cy.get('h1').should('contain', 'LUXKIDS')
  })

  it('should handle sign up form validation', () => {
    cy.visit('/auth')
    cy.get('[data-value="signup"]').click()
    
    // Try submitting empty form
    cy.get('button[type="submit"]').contains('Join LUXKIDS Platform').should('be.disabled')
    
    // Fill form partially
    cy.get('#signup-name').type('Test User')
    cy.get('button[type="submit"]').should('be.disabled')
    
    cy.get('#signup-email').type('test@example.com')
    cy.get('button[type="submit"]').should('be.disabled')
    
    cy.get('#signup-password').type('password123')
    cy.get('button[type="submit"]').should('not.be.disabled')
  })

  it('should handle sign in form validation', () => {
    cy.visit('/auth')
    cy.get('[data-value="signin"]').click()
    
    // Try submitting empty form
    cy.get('button[type="submit"]').contains('Sign In to LUXKIDS').should('be.disabled')
    
    // Fill email only
    cy.get('#signin-email').type('test@example.com')
    cy.get('button[type="submit"]').should('be.disabled')
    
    // Fill password
    cy.get('#signin-password').type('password123')
    cy.get('button[type="submit"]').should('not.be.disabled')
  })

  it('should redirect authenticated users from landing page', () => {
    // This would require mocking authentication state
    // In a real test, you'd sign in first, then visit /
    cy.log('Authentication redirect test would require actual auth setup')
  })
})