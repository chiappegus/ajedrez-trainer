# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Factory Function Instantiation Error
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the TypeError "Stockfish is not a constructor" exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing cases in stockfish-worker.js line 5
  - Test that `new self.Stockfish()` throws TypeError in worker context (from Bug Condition in design)
  - Test that `new Stockfish()` pattern fails while `Stockfish()` pattern succeeds (demonstrates factory vs constructor)
  - The test assertions should verify:
    - `new self.Stockfish()` throws TypeError with message "Stockfish is not a constructor"
    - Error prevents worker from sending "listo" message
    - Error prevents UCI communication from starting
  - Run test on UNFIXED code (current stockfish-worker.js with `new self.Stockfish()`)
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found:
    - Exact error message observed
    - Stack trace showing failure location
    - Confirmation that worker initialization fails
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - UCI Protocol and Message Handling
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-instantiation interactions:
    - UCI message parsing (extraerEvaluación, extraerProfundidad, extraerNodos)
    - Worker message passing (postMessage handlers for commands other than initialization)
    - Timeout behavior (5s initialization timeout, 2s analysis timeout)
    - Error handling for non-instantiation errors (missing FEN, analysis timeout)
  - Write property-based tests capturing observed behavior patterns:
    - Property: For all UCI info messages with "score cp N", extraerEvaluación extracts N correctly
    - Property: For all UCI info messages with "depth D", extraerProfundidad extracts D correctly
    - Property: For all UCI info messages with "nodes N", extraerNodos extracts N correctly
    - Property: For all worker commands (except initialization), postMessage handling works identically
  - Property-based testing generates many test cases for stronger preservation guarantees
  - Run tests on UNFIXED code (but skip the failing initialization - test only the parsing/handling logic)
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix Stockfish factory pattern instantiation

  - [x] 3.1 Remove `new` keyword from Stockfish instantiation in stockfish-worker.js
    - Open `public/stockfish-worker.js`
    - Locate the `inicializarStockfish()` function (approximately line 96-105)
    - Find the line: `stockfish = new self.Stockfish();` (approximately line 5 or within the function)
    - Replace with: `stockfish = self.Stockfish();` (factory function call without `new`)
    - Update the comment from "Create instance of Stockfish" to "Call Stockfish factory function"
    - Add JSDoc comment: `// Note: Stockfish is a factory function, NOT a constructor - do not use 'new' keyword`
    - _Bug_Condition: isBugCondition(code) where code.pattern matches /new\s+(self\.)?Stockfish\(/_
    - _Expected_Behavior: Factory function call returns valid engine instance that responds to UCI commands (from Property 1 in design)_
    - _Preservation: UCI protocol handling, message passing, and analysis functionality must remain unchanged (from Preservation Requirements in design)_
    - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 3.4_

  - [x] 3.2 Add TypeScript documentation to prevent future constructor usage
    - Open `src/services/stockfish/MotorStockfish.ts`
    - Review line 91 and surrounding code (currently commented out)
    - Add JSDoc comment above any Stockfish-related type definitions:
      ```typescript
      /**
       * Stockfish engine interface.
       * IMPORTANT: Stockfish is a FACTORY FUNCTION, not a constructor.
       * Call it directly: Stockfish() - DO NOT use 'new' keyword.
       * Incorrect: new Stockfish() ❌
       * Correct: Stockfish() ✓
       */
      ```
    - Add defensive type guard if direct Stockfish usage is added in the future
    - _Requirements: 2.1, 3.1_

  - [x] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Factory Function Instantiation Success
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms:
      - `self.Stockfish()` (without new) successfully returns engine instance
      - Worker sends "listo" message after initialization
      - UCI communication starts successfully
      - No TypeError "Stockfish is not a constructor" occurs
    - Run bug condition exploration test from step 1
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - UCI Protocol and Message Handling
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all UCI message parsing works identically:
      - extraerEvaluación extracts scores correctly
      - extraerProfundidad extracts depth correctly
      - extraerNodos extracts nodes correctly
    - Confirm message passing and timeout behavior unchanged
    - Confirm error handling for non-instantiation errors unchanged

- [x] 4. Integration testing and checkpoint
  - Test full initialization flow:
    - Load worker → initialize Stockfish → send uci → receive uciok → send isready → receive readyok
  - Test full analysis flow:
    - Set position with FEN → start analysis → receive info messages → receive bestmove
    - Verify análisis results display correctly in UI
  - Test error recovery scenarios:
    - Missing Stockfish files → graceful error message
    - Analysis timeout → proper timeout handling
  - Verify in browser console that no "Stockfish is not a constructor" errors appear
  - Ensure all tests pass
  - Ask the user if questions arise or if ready to proceed to next phase
