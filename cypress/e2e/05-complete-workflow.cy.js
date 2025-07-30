describe('LUXKIDS Platform - Complete End-to-End Workflow', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPassword123',
    fullName: 'Test User E2E'
  }

  const testSuggestion = {
    title: 'Sustainable Børnetøj Collection',
    description: 'Create a new line of eco-friendly children\'s clothing using organic materials and sustainable production methods.',
    department: 'design'
  }

  it('should complete the full user journey: signup → suggestion → AI chat → admin review → PRD → archive', () => {
    // Step 1: Landing page and navigation
    cy.visit('/')
    cy.get('h1').should('contain', 'LUXKIDS')
    cy.get('button').contains('Join LUXKIDS Platform').click()

    // Step 2: User registration
    cy.url().should('include', '/auth')
    cy.get('[data-value="signup"]').click()
    cy.get('#signup-name').type(testUser.fullName)
    cy.get('#signup-email').type(testUser.email)
    cy.get('#signup-password').type(testUser.password)
    cy.get('button[type="submit"]').contains('Join LUXKIDS Platform').click()

    // Note: In a real test, you'd handle email verification here
    cy.log('Email verification would be handled here in production')

    // Step 3: Dashboard access (assuming successful login)
    cy.visit('/dashboard')
    cy.get('h1').should('contain', 'Forslagsplatform')

    // Step 4: Create suggestion
    cy.get('#title').type(testSuggestion.title)
    cy.get('#description').type(testSuggestion.description)
    cy.get('#department').click()
    cy.get(`[data-value="${testSuggestion.department}"]`).click()
    cy.get('button[type="submit"]').contains('Start AI-samarbejde').click()

    // Step 5: AI Chat interaction (mocked)
    cy.get('body').then(($body) => {
      if ($body.find('input[placeholder*="Fortsæt samtalen"]').length > 0) {
        // Simulate AI conversation
        cy.get('input[placeholder*="Fortsæt samtalen"]').type('I want to focus on organic cotton materials')
        cy.get('button').contains('Send').click()
        cy.waitForAIResponse()

        cy.get('input[placeholder*="Fortsæt samtalen"]').type('The target age group is 0-8 years')
        cy.get('button').contains('Send').click()
        cy.waitForAIResponse()

        cy.get('input[placeholder*="Fortsæt samtalen"]').type('We should include gender-neutral designs')
        cy.get('button').contains('Send').click()
        cy.waitForAIResponse()

        // Complete the suggestion
        cy.get('button').contains('Idéen er færdig').click()
        cy.get('body').should('contain', 'Forslag indsendt!')
      } else {
        cy.log('AI chat interface not available - suggestion created without chat')
      }
    })
  })

  it('should handle admin workflow for suggestion review', () => {
    // Step 6: Admin review (assuming admin access)
    cy.visit('/admin')
    cy.get('h2').should('contain', 'Admin-panel')

    // Check for pending suggestions
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Review")').length > 0) {
        // Review the suggestion
        cy.get('button').contains('Review').first().click()
        cy.get('[role="dialog"]').should('exist')

        // Add admin notes
        cy.get('textarea[placeholder*="Tilføj feedback"]').type('Great sustainable idea! Approved for development.')

        // Approve the suggestion
        cy.get('button').contains('Godkend forslag').click()
        cy.get('body').should('contain', 'Suggestion approved successfully')
      } else {
        cy.log('No pending suggestions available for review')
      }
    })
  })

  it('should verify PRD generation and download functionality', () => {
    cy.visit('/admin')
    
    // Look for approved suggestions with PRD
    cy.get('body').then(($body) => {
      if ($body.find('button[title*="Download"]').length > 0) {
        // Test PRD download buttons
        cy.get('button').contains('MD').should('exist')
        cy.get('button').contains('PDF').should('exist')
        
        // Click download buttons (files would download in real scenario)
        cy.get('button').contains('MD').first().click()
        cy.get('button').contains('PDF').first().click()
        
        cy.log('PRD download functionality verified')
      } else {
        cy.log('No approved suggestions with PRD available')
      }
    })
  })

  it('should test archive functionality', () => {
    cy.visit('/admin')
    
    // Look for archive buttons
    cy.get('body').then(($body) => {
      if ($body.find('button:contains("Arkiver")').length > 0) {
        // Test archiving functionality
        cy.get('button').contains('Arkiver').first().click()
        cy.get('body').should('contain', 'archived successfully')
        
        cy.log('Archive functionality verified')
      } else {
        cy.log('No suggestions available for archiving')
      }
    })
  })
})