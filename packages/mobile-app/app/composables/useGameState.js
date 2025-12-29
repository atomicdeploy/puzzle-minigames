import { ref, computed } from 'vue';

// Game state composable
export function useGameState() {
  // Constants
  const PUZZLE_SIZE = 9;
  
  // State
  const discoveredPuzzles = ref(new Set());
  const puzzleBoard = ref(Array(PUZZLE_SIZE).fill(null));
  const solution = ref([1, 2, 3, 4, 5, 6, 7, 8, 9]); // Simple Sudoku solution for 3x3
  const draggingPiece = ref(null);
  const isGameComplete = ref(false);
  
  // Computed
  const discoveredCount = computed(() => discoveredPuzzles.value.size);
  const completionPercentage = computed(() => (discoveredCount.value / PUZZLE_SIZE) * 100);
  
  // Methods
  function discoverPuzzle(puzzleNumber) {
    discoveredPuzzles.value.add(puzzleNumber);
    saveGameState();
  }
  
  function placePuzzle(position, puzzleNumber) {
    if (position >= 0 && position < PUZZLE_SIZE) {
      puzzleBoard.value[position] = puzzleNumber;
      checkCompletion();
      saveGameState();
    }
  }
  
  function removePuzzle(position) {
    if (position >= 0 && position < PUZZLE_SIZE) {
      puzzleBoard.value[position] = null;
      isGameComplete.value = false;
      saveGameState();
    }
  }
  
  function checkCompletion() {
    const allPlaced = puzzleBoard.value.every((piece, index) => 
      piece === solution.value[index]
    );
    isGameComplete.value = allPlaced;
    return allPlaced;
  }
  
  function validatePlacement(position, puzzleNumber) {
    return solution.value[position] === puzzleNumber;
  }
  
  function saveGameState() {
    if (typeof localStorage !== 'undefined') {
      const state = {
        discoveredPuzzles: Array.from(discoveredPuzzles.value),
        puzzleBoard: puzzleBoard.value,
      };
      localStorage.setItem('infernal-puzzle-game', JSON.stringify(state));
    }
  }
  
  function loadGameState() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('infernal-puzzle-game');
      if (saved) {
        try {
          const state = JSON.parse(saved);
          discoveredPuzzles.value = new Set(state.discoveredPuzzles || []);
          puzzleBoard.value = state.puzzleBoard || Array(PUZZLE_SIZE).fill(null);
          checkCompletion();
        } catch (error) {
          console.error('Error loading game state:', error);
        }
      }
    }
  }
  
  function resetGame() {
    discoveredPuzzles.value = new Set();
    puzzleBoard.value = Array(PUZZLE_SIZE).fill(null);
    isGameComplete.value = false;
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('infernal-puzzle-game');
    }
  }
  
  return {
    // State
    discoveredPuzzles,
    puzzleBoard,
    solution,
    draggingPiece,
    isGameComplete,
    
    // Computed
    discoveredCount,
    completionPercentage,
    
    // Methods
    discoverPuzzle,
    placePuzzle,
    removePuzzle,
    validatePlacement,
    loadGameState,
    saveGameState,
    resetGame,
    checkCompletion,
  };
}
