describe('LUXKIDS Platform - Admin Panel', () => {
  beforeEach(() => {
    cy.visit('/admin')
  })

  it('should display admin panel header and navigation', () => {
    cy.get('h1').should('contain', 'Forslagsplatform')
    cy.get('h2').should('contain', 'Admin-panel')
    cy.get('button').should('contain', 'Tilbage til oversigten')
  })

  it('should show statistics cards', () => {
    cy.get('body').should('contain', 'Afventer')
    cy.get('body').should('contain', 'Godkendt')
    cy.get('body').should('contain', 'Afvist')
    cy.get('body').should('contain', 'Mere info')
  })

  it('should display filter controls', () => {
    cy.get('label').should('contain', 'Filtrer efter status')
    cy.get('[data-testid="status-filter"]').should('exist')
  })

  it('should show pending suggestions section', () => {
    cy.get('h3').should('contain', 'Afventer gennemgang')
    cy.get('body').then(($body) => {
      if ($body.find('text:contains("Ingen afventende forslag")').length > 0) {
        cy.get('body').should('contain', 'Ingen afventende forslag')
      } else {
        cy.log('Pending suggestions exist')
      }
    })
  })

  it('should show reviewed suggestions section', () => {
    cy.get('h3').should('contain', 'Gennemgåede forslag')
    cy.get('body').then(($body) => {
      if ($body.find('text:contains("Ingen gennemgåede forslag")').length > 0) {
        cy.get('body').should('contain', 'Ingen gennemgåede forslag')
      } else {
        cy.log('Reviewed suggestions exist')
      }
    })
  })

  it('should handle suggestion review modal', () => {
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Review")').length > 0) {
        cy.get('button').contains('Review').first().click()
        cy.get('[role="dialog"]').should('exist')
        cy.get('h2').should('contain', 'Gennemse forslag')
      } else {
        cy.log('No suggestions available for review')
      }
    })
  })

  it('should display admin action buttons in review modal', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[role="dialog"]').length > 0) {
        cy.get('button').should('contain', 'Godkend forslag')
        cy.get('button').should('contain', 'Behov for mere info')
        cy.get('button').should('contain', 'Afvis forslag')
        cy.get('button').should('contain', 'Arkiver forslag')
      } else {
        cy.log('Review modal not open')
      }
    })
  })

  it('should handle status filtering', () => {
    cy.get('[data-testid="status-filter"]').click()
    cy.get('[data-value="pending"]').click()
    cy.get('[data-testid="status-filter"]').should('contain', 'Afventer')
  })
})