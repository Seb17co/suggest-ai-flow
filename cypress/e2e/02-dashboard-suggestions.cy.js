describe('LUXKIDS Platform - Dashboard and Suggestions', () => {
  beforeEach(() => {
    // Note: In a real test environment, you'd set up authentication properly
    // For now, we'll test the UI components and interactions
    cy.visit('/dashboard')
  })

  it('should display dashboard header and navigation', () => {
    cy.get('h1').should('contain', 'Forslagsplatform')
    cy.get('h2').should('contain', 'Velkommen tilbage')
    cy.get('button').should('contain', 'Sign Out')
  })

  it('should show suggestion form with all required fields', () => {
    cy.get('h3').should('contain', 'Del din idé')
    cy.get('#title').should('exist')
    cy.get('#description').should('exist')
    cy.get('#department').should('exist')
    cy.get('button[type="submit"]').should('contain', 'Start AI-samarbejde')
  })

  it('should validate suggestion form fields', () => {
    // Initially button should be disabled
    cy.get('button[type="submit"]').should('be.disabled')
    
    // Fill title only
    cy.get('#title').type('Test Suggestion')
    cy.get('button[type="submit"]').should('be.disabled')
    
    // Fill description
    cy.get('#description').type('This is a test suggestion for børnetøj improvement')
    cy.get('button[type="submit"]').should('be.disabled')
    
    // Select department
    cy.get('#department').click()
    cy.get('[data-value="design"]').click()
    cy.get('button[type="submit"]').should('not.be.disabled')
  })

  it('should show all department options in dropdown', () => {
    cy.get('#department').click()
    cy.get('[data-value="salg"]').should('exist')
    cy.get('[data-value="marketing"]').should('exist')
    cy.get('[data-value="indkøb"]').should('exist')
    cy.get('[data-value="design"]').should('exist')
    cy.get('[data-value="lager"]').should('exist')
  })

  it('should display suggestions list section', () => {
    cy.get('h3').should('contain', 'Dine forslag')
    // Check for empty state or existing suggestions
    cy.get('body').then(($body) => {
      if ($body.find('text:contains("Ingen forslag endnu")').length > 0) {
        cy.get('text').should('contain', 'Ingen forslag endnu')
      } else {
        cy.log('Suggestions exist in the list')
      }
    })
  })

  it('should handle admin panel access for admin users', () => {
    // This would depend on user role
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Admin Panel")').length > 0) {
        cy.get('button').contains('Admin Panel').should('exist')
        cy.get('button').contains('Admin Panel').click()
        cy.url().should('include', '/admin')
      } else {
        cy.log('User does not have admin access')
      }
    })
  })
})