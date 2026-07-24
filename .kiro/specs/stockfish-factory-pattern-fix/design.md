# Stockfish Factory Pattern Fix - Bugfix Design

## Overview

The application incorrectly attempts to instantiate Stockfish using the `new` keyword (`new Stockfish()`), but the stockfish.js library exports a factory function, not a constructor class. This causes a "Stockfish is not a constructor" TypeError. The fix requires changing the instantiation pattern from constructor-based (`new Stockfish()`) to factory function-based (`Stockfish()`) in both the main thread code (MotorStockfish.ts) and the Web Worker code (stockfish-worker.js).

**Fix Approach**: Replace `new Stockfish()` with `Stockfish()` (factory function call) in both files where the engine is instantiated.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when code attempts to use `new` keyword with the Stockfish factory function
- **Property (P)**: The desired behavior when Stockfish is instantiated - the factory function should be called without `new` keyword and return a valid engine instance
- **Preservation**: Existing UCI protocol handling, message passing, and analysis functionality that must remain unchanged after the fix
- **Factory Function**: A function that returns an object instance without requiring the `new` keyword (pattern used by stockfish.js)
- **Constructor Function**: A function designed to be called with `new` keyword to create instances (NOT the pattern used by stockfish.js)
- **MotorStockfish**: The TypeScript class in `src/services/stockfish/MotorStockfish.ts` that wraps the Stockfish engine for the main thread
- **stockfish-worker.js**: The Web Worker file in `public/stockfish-worker.js` that runs Stockfish in a separate thread

## Bug Details

### Bug Condition

The bug manifests when the code attempts to instantiate Stockfish using the `new` keyword (`new Stockfish()` or `new self.Stockfish()`), treating it as a constructor function when it's actually a factory function. This occurs in two locations:
1. `MotorStockfish.ts` line 91 (if uncommented)
2. `stockfish-worker.js` line 5 (active code)

**Formal Specification:**
```
FUNCTION isBugCondition(code)
  INPUT: code of type CodeLocation
  OUTPUT: boolean
  
  RETURN code.pattern MATCHES /new\s+(self\.)?Stockfish\(/
         AND code.context = "stockfish_instantiation"
END FUNCTION
```

**Code Pattern Analysis:**
- **Buggy Pattern**: `stockfish = new Stockfish();` or `stockfish = new self.Stockfish();`
- **Correct Pattern**: `stockfish = Stockfish();` or `stockfish = self.Stockfish();`

### Examples

- **Current (Buggy)**: `stockfish = new self.Stockfish();` in stockfish-worker.js line 5
  - **Actual Result**: TypeError "Stockfish is not a constructor"
  - **Expected Result**: Valid Stockfish engine instance

- **Current (Buggy)**: `this.worker = new Worker('/stockfish-worker.js');` in MotorStockfish.ts
  - **Actual Result**: Worker starts but fails to initialize Stockfish internally
  - **Expected Result**: Worker initializes Stockfish successfully

- **Edge Case**: If Stockfish factory function is undefined or not loaded
  - **Expected Behavior**: Should fail with clear error message about missing Stockfish, not constructor error

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- UCI protocol message handling (uciok, readyok, info, bestmove) must continue to work
- Web Worker message passing between main thread and worker must continue to function
- Analysis results (mejor jugada, evaluación, mate, profundidad, nodos) must continue to be extracted correctly
- Timeout mechanisms (5s initialization, 2s analysis) must continue to work
- File loading paths for Stockfish WASM and JavaScript files must remain unchanged

**Scope:**
All code paths that do NOT involve the Stockfish instantiation line should be completely unaffected by this fix. This includes:
- UCI message parsing logic
- Evaluation extraction functions
- Promise handling for async analysis
- Worker lifecycle management (terminate, message passing)
- Error handling for non-instantiation errors

## Hypothesized Root Cause

Based on the bug description and code analysis, the root cause is:

1. **Incorrect Instantiation Pattern**: The code uses `new Stockfish()` which assumes Stockfish is a constructor function, but stockfish.js exports a factory function that should be called directly without `new`
   - This is a common pattern mismatch when integrating JavaScript libraries
   - Factory functions return instances directly; constructors require `new`

2. **Documentation Misunderstanding**: The developer may have assumed stockfish.js uses a constructor pattern based on class-like naming ("Stockfish" with capital S)
   - Modern JavaScript convention: capital names suggest classes/constructors
   - However, stockfish.js predates modern ES6 classes and uses factory pattern

3. **Copy-Paste Error**: Code may have been adapted from examples that used different Stockfish wrappers or versions that did use constructor pattern

4. **Lack of Type Checking**: TypeScript wasn't catching this error because:
   - The Stockfish library is loaded dynamically via importScripts in worker
   - No TypeScript type definitions exist for the Stockfish global
   - Worker code is JavaScript, not TypeScript

## Correctness Properties

Property 1: Bug Condition - Factory Function Instantiation

_For any_ code location where Stockfish factory function is called (either in main thread or worker), the instantiation SHALL use the pattern `Stockfish()` or `self.Stockfish()` without the `new` keyword, successfully returning a valid engine instance that responds to UCI commands.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - UCI Protocol Handling

_For any_ UCI protocol interaction or message passing flow that does NOT involve the instantiation line (parsing info messages, handling bestmove, extracting evaluations, managing timeouts), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing UCI communication and analysis functionality.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct (factory pattern mismatch):

**File**: `public/stockfish-worker.js`

**Location**: Function `inicializarStockfish()`, approximately line 96-105

**Specific Changes**:
1. **Remove `new` keyword from Stockfish instantiation**:
   ```javascript
   // BEFORE (buggy):
   stockfish = new self.Stockfish();
   
   // AFTER (fixed):
   stockfish = self.Stockfish();
   ```

2. **Update comments to reflect factory pattern**:
   - Change comment from "Create instance of Stockfish" to "Call Stockfish factory function"
   - Add note explaining it's a factory function, not a constructor

**File**: `src/services/stockfish/MotorStockfish.ts`

**Location**: Method `inicializar()`, line 91 (currently commented out)

**Specific Changes**:
1. **Verify any instantiation code uses factory pattern**:
   - Current code uses Web Worker pattern: `new Worker('/stockfish-worker.js')`
   - This is correct (Worker IS a constructor)
   - The Stockfish instantiation happens inside the worker, not here
   - No changes needed in this file unless direct Stockfish usage is added later

2. **Add defensive coding for future maintainability**:
   - Add TypeScript interface or type guard to document that Stockfish is a factory function
   - Add JSDoc comment warning future developers not to use `new` keyword

**File**: `src/services/stockfish/stockfish-worker.ts` (type definitions)

**Specific Changes**:
1. **Document the factory pattern in TypeScript types**:
   - Add JSDoc comment to type definitions explaining factory pattern
   - This prevents future developers from making the same mistake

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code (confirming the TypeError occurs), then verify the fix works correctly and preserves existing UCI protocol handling.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that using `new Stockfish()` causes TypeError on unfixed code. If we don't see the TypeError, we need to re-hypothesize.

**Test Plan**: Write tests that attempt to instantiate Stockfish using the `new` keyword pattern. Run these tests on the UNFIXED code to observe TypeError and confirm the bug exists.

**Test Cases**:
1. **Worker Instantiation Test**: Call `new self.Stockfish()` in a test worker environment (will fail on unfixed code)
2. **Factory vs Constructor Test**: Verify that `Stockfish()` (without new) works while `new Stockfish()` fails (will demonstrate the pattern mismatch)
3. **Worker Initialization Test**: Load the unfixed stockfish-worker.js and verify it fails with "Stockfish is not a constructor" error
4. **Error Message Validation**: Confirm the exact error message is "Stockfish is not a constructor" (helps verify our hypothesis)

**Expected Counterexamples**:
- `new self.Stockfish()` throws TypeError "Stockfish is not a constructor"
- Worker sends error message containing "Stockfish is not a constructor"
- Possible causes: factory function being treated as constructor, incorrect library usage pattern

### Fix Checking

**Goal**: Verify that for all code locations where Stockfish is instantiated, the fixed code successfully creates a valid engine instance without TypeError.

**Pseudocode:**
```
FOR ALL codeLocation WHERE isBugCondition(codeLocation) DO
  result := executeInstantiation_fixed(codeLocation)
  ASSERT result.engineInstance IS valid
  ASSERT result.respondsToUCI = true
  ASSERT result.error IS null
END FOR
```

**Test Approach**: After applying fix, verify:
- Stockfish instantiation succeeds without errors
- Engine responds to UCI commands (uci, isready)
- Worker sends "listo" message after successful initialization
- No TypeError appears in console or error logs

### Preservation Checking

**Goal**: Verify that for all code paths that do NOT involve the instantiation line, the fixed code produces the same result as the original code.

**Pseudocode:**
```
FOR ALL interaction WHERE NOT isBugCondition(interaction.location) DO
  ASSERT handleUCIMessage_original(interaction) = handleUCIMessage_fixed(interaction)
  ASSERT extractEvaluation_original(interaction) = extractEvaluation_fixed(interaction)
  ASSERT parseDepth_original(interaction) = parseDepth_fixed(interaction)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the UCI message domain
- It catches edge cases in message parsing that manual unit tests might miss
- It provides strong guarantees that UCI protocol handling is unchanged for all message types

**Test Plan**: Observe behavior on UNFIXED code first for UCI message handling, then write property-based tests capturing that behavior.

**Test Cases**:
1. **UCI Message Parsing Preservation**: Observe that `extraerEvaluación()`, `extraerProfundidad()`, `extraerNodos()` work correctly on unfixed code, then verify identical behavior after fix
2. **Message Passing Preservation**: Observe that worker postMessage/onmessage handling works correctly (for messages other than initialization), then verify preservation
3. **Timeout Behavior Preservation**: Observe that 5s initialization timeout and 2s analysis timeout work correctly, then verify preservation
4. **Error Handling Preservation**: Observe error handling for non-instantiation errors (analysis timeout, missing FEN), then verify preservation

### Unit Tests

- Test Stockfish instantiation with factory pattern (without `new`)
- Test that engine responds to UCI commands after instantiation
- Test error handling when Stockfish global is undefined
- Test that Worker itself is still instantiated correctly with `new Worker()`

### Property-Based Tests

- Generate random UCI commands and verify they're handled identically before/after fix
- Generate random FEN positions and verify analysis flow works correctly
- Generate random evaluation strings ("score cp 25", "score mate 3") and verify parsing is identical

### Integration Tests

- Test full initialization flow: load worker → initialize Stockfish → send uci → receive uciok → send isready → receive readyok
- Test full analysis flow: set position → start analysis → receive info messages → receive bestmove
- Test error recovery: initialization failure → error message → graceful degradation
