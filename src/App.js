import { useReducer, useState } from "react";
import DigitButton from "./DigitButton";
import OperationButton from "./OperationButton";
import "./styles.css";
import { useSpeechSynthesis } from "react-speech-kit";

export const ACTIONS = {
  ADD_DIGIT: "add-digit",
  CHOOSE_OPERATION: "choose-operation",
  CLEAR: "clear",
  DELETE_DIGIT: "delete-digit",
  EVALUATE: "evaluate",
};

let result = "hi";

function reducer(state, { type, payload }) {
  switch (type) {
    // ADD DIGITS
    case ACTIONS.ADD_DIGIT:
      // Prevents ( 5 * 2 = 10, 103) instead of (5 * 2 = 10, 3 )
      if (state.overwrite) {
        return {
          ...state,
          currentOperand: payload.digit,
          overwrite: false,
        };
      }
      // Prevent "000000" and restict to only one 0
      if (payload.digit === "0" && state.currentOperand === "0") {
        return state;
      }
      // Prevent multiple periods from being input
      if (payload.digit === "." && state.currentOperand.includes(".")) {
        return state;
      }
      // Otherwise normal return operation to the field box
      return {
        ...state,
        currentOperand: `${state.currentOperand || ""}${payload.digit}`,
      };

    // CHOOSE OPERATION
    case ACTIONS.CHOOSE_OPERATION:
      // Nothing happens if there is nothing input to previousOperand
      if (state.currentOperand == null && state.previousOperand == null) {
        return state;
      }

      // Allows users to update their operation without losing the previousOperand
      if (state.currentOperand == null) {
        return {
          ...state,
          operation: payload.operation,
        };
      }
      /* If there is only a current operand, when an operation is selected, the current becomes the 
      and everything together becomes the previous operand */
      if (state.previousOperand == null) {
        return {
          ...state,
          operation: payload.operation,
          previousOperand: state.currentOperand,
          currentOperand: null,
        };
      }

      // Default operation to handle contents of field after operation completes
      return {
        ...state,
        previousOperand: evaluate(state),
        operation: payload.operation,
        currentOperand: null,
      };

    // CLEAR
    case ACTIONS.CLEAR:
      // returns everything back to initial state
      return {};

    case ACTIONS.DELETE_DIGIT:
      if (state.overwrite) {
        return {
          ...state,
          overwrite: false,
          currentOperand: null,
        };
      }
      if (state.currentOperand == null) return state;
      if (state.currentOperand.length === 1) {
        return { ...state, currentOperand: null };
      }

      return {
        ...state,
        currentOperand: state.currentOperand.slice(0, -1),
      };
    case ACTIONS.EVALUATE:
      // Do nothing unless we have all three pieces of the operation
      if (
        state.operation == null ||
        state.currentOperand == null ||
        state.previousOperand == null
      ) {
        return state;
      }

      // Otherwise return the state, refresh the values, and update currentOperand to the result
      result = evaluate(state);
      return {
        ...state,
        overwrite: true,
        previousOperand: null,
        operation: null,
        currentOperand: evaluate(state),
      };
  }
}

// Calculator functionality
function evaluate({ currentOperand, previousOperand, operation }) {
  const prev = parseFloat(previousOperand); // convert operands from strings to numbers
  const current = parseFloat(currentOperand);
  if (isNaN(prev) || isNaN(current)) return "";
  let computation = "";
  switch (operation) {
    case "+":
      computation = prev + current;
      break;
    case "-":
      computation = prev - current;
      break;
    case "*":
      computation = prev * current;
      break;
    case "÷":
      computation = prev / current;
      break;
  }

  return computation.toString();
}

// Adds commas to large number
const INTEGER_FORMATTER = new Intl.NumberFormat("en-us", {
  maximumFractionDigits: 0,
});
function formatOperand(operand) {
  if (operand == null) return;
  const [integer, decimal] = operand.split(".");
  if (decimal == null) return INTEGER_FORMATTER.format(integer);
  return `${INTEGER_FORMATTER.format(integer)}.${decimal}`;
}

function App() {
  const [{ currentOperand, previousOperand, operation }, dispatch] = useReducer(
    reducer,
    {}
  );

  const [text, setText] = useState("");
  const { speak } = useSpeechSynthesis();

  return (
    <div className="calculator-grid">
      <div className="output">
        <div className="previous-operand">
          {formatOperand(previousOperand)} {operation}
        </div>
        <div className="current-operand">{formatOperand(currentOperand)}</div>
      </div>
      <button
        className="span-two"
        onClick={() => dispatch({ type: ACTIONS.CLEAR })}
      >
        AC
      </button>
      <button onClick={() => dispatch({ type: ACTIONS.DELETE_DIGIT })}>
        DEL
      </button>
      <OperationButton operation="÷" dispatch={dispatch} />
      <DigitButton digit="1" dispatch={dispatch} />
      <DigitButton digit="2" dispatch={dispatch} />
      <DigitButton digit="3" dispatch={dispatch} />
      <OperationButton operation="*" dispatch={dispatch} />
      <DigitButton digit="4" dispatch={dispatch} />
      <DigitButton digit="5" dispatch={dispatch} />
      <DigitButton digit="6" dispatch={dispatch} />
      <OperationButton operation="+" dispatch={dispatch} />
      <DigitButton digit="7" dispatch={dispatch} />
      <DigitButton digit="8" dispatch={dispatch} />
      <DigitButton digit="9" dispatch={dispatch} />
      <OperationButton operation="-" dispatch={dispatch} />
      <DigitButton digit="." dispatch={dispatch} />
      <DigitButton digit="0" dispatch={dispatch} />
      <button
        className="span-two"
        onClick={() => {
          dispatch({ type: ACTIONS.EVALUATE });
          setText(result);
          console.log(result);
          speak({ text: text });
        }}
      >
        =
      </button>
    </div>
  );
}

export default App;
