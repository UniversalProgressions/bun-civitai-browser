# System Patterns and Architecture Decisions

## ElysiaJS Best Practices Reference

### Primary Documentation
When editing or adding backend code using ElysiaJS, developers **MUST** consult and follow the official ElysiaJS Best Practices documentation:

**📚 ElysiaJS Best Practices Guide:**  
https://elysiajs.com/essential/best-practice.md

### Usage Instructions
1. **Before making any backend changes**, review the relevant sections of the ElysiaJS Best Practices documentation
2. **When implementing new features**, ensure your code aligns with the patterns described in the documentation
3. **During code review**, verify that ElysiaJS patterns follow the official best practices
4. **When refactoring**, use the documentation as a reference for improving existing code

### Key Areas Covered in Documentation
The ElysiaJS Best Practices documentation provides guidance on:
- Folder structure and organization
- Controller implementation patterns
- Service layer design
- Validation strategies
- Error handling
- Testing approaches
- Plugin usage

### Project-Specific Considerations
While following ElysiaJS best practices, note these project-specific constraints:
- Arktype is used for validation instead of Elysia.t due to Civitai API data structure inconsistencies
- Feature-based modular architecture is already implemented in `src/modules/`
- Existing error handling patterns should be maintained

### Compliance Checklist
When editing backend code, ensure:
- [ ] Consulted ElysiaJS Best Practices documentation
- [ ] Followed recommended folder structure patterns
- [ ] Used Elysia instances appropriately as controllers
- [ ] Maintained proper separation between HTTP layer and business logic
- [ ] Implemented error handling according to Elysia patterns
- [ ] Added appropriate validation (using arktype for external APIs)

---
*Last Updated: December 2025*  
*Maintainer: Development Team*  
*Reference: ElysiaJS Documentation v1.4.16*
