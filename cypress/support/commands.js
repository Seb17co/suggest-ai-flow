// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom commands for LUXKIDS suggestion platform testing

Cypress.Commands.add('signUp', (email, password, fullName) => {
  cy.visit('/auth')
  cy.get('[data-testid="signup-tab"]').click()
  cy.get('#signup-name').type(fullName)
  cy.get('#signup-email').type(email)
  cy.get('#signup-password').type(password)
  cy.get('button[type="submit"]').contains('Join LUXKIDS Platform').click()
})

Cypress.Commands.add('signIn', (email, password) => {
  cy.visit('/auth')
  cy.get('[data-testid="signin-tab"]').click()
  cy.get('#signin-email').type(email)
  cy.get('#signin-password').type(password)
  cy.get('button[type="submit"]').contains('Sign In to LUXKIDS').click()
})

Cypress.Commands.add('createSuggestion', (title, description, department) => {
  cy.get('#title').type(title)
  cy.get('#description').type(description)
  cy.get('#department').click()
  cy.get(`[data-value="${department}"]`).click()
  cy.get('button[type="submit"]').contains('Start AI-samarbejde').click()
})

Cypress.Commands.add('waitForAIResponse', () => {
  cy.get('.animate-pulse').should('exist')
  cy.get('.animate-pulse').should('not.exist', { timeout: 15000 })
})

Cypress.Commands.add('resetDatabase', () => {
  // In a real scenario, you'd reset the test database here
  cy.log('Database reset would happen here in production')
})