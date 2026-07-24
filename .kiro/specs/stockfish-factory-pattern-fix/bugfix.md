# Bugfix Requirements Document

## Introduction

The application is attempting to instantiate Stockfish using the `new` keyword (`new Stockfish()`), but the stockfish.js library exports a factory function, not a constructor class. This causes a "Stockfish is not a constructor" TypeError, preventing the chess engine from initializing and blocking all game analysis functionality.

**Impact**: Critical - users cannot analyze chess games, which is core functionality.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN `new Stockfish()` is called in MotorStockfish.ts (line 91) THEN the system throws TypeError "Stockfish is not a constructor"

1.2 WHEN `new self.Stockfish()` is called in stockfish-worker.js (line 5) THEN the system throws TypeError "Stockfish is not a constructor"

1.3 WHEN the Stockfish engine fails to initialize THEN the user receives error "Stockfish no inicializado" and cannot perform game analysis

### Expected Behavior (Correct)

2.1 WHEN Stockfish factory function is called in MotorStockfish.ts THEN the system SHALL invoke `Stockfish()` (without `new` keyword) and successfully initialize the engine

2.2 WHEN Stockfish factory function is called in stockfish-worker.js THEN the system SHALL invoke `self.Stockfish()` (without `new` keyword) and successfully initialize the worker engine

2.3 WHEN the Stockfish engine initializes successfully THEN the user SHALL be able to analyze chess games without initialization errors

### Unchanged Behavior (Regression Prevention)

3.1 WHEN Stockfish sends UCI protocol messages THEN the system SHALL CONTINUE TO process them correctly with existing message handlers

3.2 WHEN users interact with chess analysis features (analyze game, view explanations, navigate moves) THEN the system SHALL CONTINUE TO function correctly after engine initialization

3.3 WHEN the worker sends messages back to the main thread THEN the system SHALL CONTINUE TO handle postMessage communication correctly

3.4 WHEN Stockfish.wasm and other engine files are loaded THEN the system SHALL CONTINUE TO load them from the correct paths without modification
