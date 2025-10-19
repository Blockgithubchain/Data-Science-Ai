import { GoogleGenAI, Type } from "@google/genai";
import { ModelSuggestion, Metrics, TaskType } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export async function generateModelSuggestions(goal: string, fileType: 'csv' | 'image'): Promise<ModelSuggestion> {
  const model = 'gemini-2.5-flash';
  const prompt = `You are an expert data scientist. For a data science task of '${goal}' using ${fileType} data, provide a list of suitable machine learning models.

Your response must be a valid JSON object with the following structure:
{
  "recommended": "The single best model for this task",
  "options": ["A list of 3-4 other strong candidates for this specific task"],
  "more_models": ["A comprehensive list of other well-known models relevant to this general task type (e.g., if it's classification, list other classifiers; if regression, other regressors). Ensure this list does not duplicate models from 'recommended' or 'options'."]
}

For example, for a classification task like sentiment analysis, 'recommended' could be 'BERT', 'options' could be ['RoBERTa', 'Logistic Regression', 'XGBoost'], and 'more_models' could include ['Gaussian Naive Bayes', 'Support Vector Machine', 'K-Nearest Neighbors', 'Decision Tree', 'Random Forest'].

Respond ONLY with the JSON object.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommended: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          more_models: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ['recommended', 'options', 'more_models']
      }
    }
  });
  
  const text = response.text.trim();
  try {
    return JSON.parse(text) as ModelSuggestion;
  } catch (e) {
    console.error("Failed to parse model suggestions JSON:", text, e);
    throw new Error("Received invalid format for model suggestions.");
  }
}

export async function extractTargetColumn(goal: string, headers: string[]): Promise<string> {
    const model = 'gemini-2.5-flash';
    const prompt = `
    Given the data science goal: "${goal}" and the available CSV columns: [${headers.join(', ')}].
    Identify the single column that is the target variable for prediction or classification.
    Respond ONLY with the name of that column as a plain string. For example: "median_house_value".
    Do not add any explanation or formatting. If no clear target can be identified, return the last column name from the list.
    `;

    const response = await ai.models.generateContent({ model, contents: prompt });
    const potentialTarget = response.text.trim().replace(/"/g, ''); // Clean up potential quotes

    // Validate that the returned column name is one of the headers
    if (headers.includes(potentialTarget)) {
        return potentialTarget;
    }
    
    // Fallback if the model hallucinates a column name
    console.warn(`Gemini suggested a target column "${potentialTarget}" not in headers. Falling back to the last column.`);
    return headers[headers.length - 1];
}

export async function generateWorkflowExplanation(goal: string, model: string, fileType: string, headers?: string[], fileContent?: string): Promise<string> {
    const modelAI = 'gemini-2.5-flash';

    // Fallback for image files or incomplete data to the simpler prompt
    if (fileType === 'image' || !headers || !fileContent) {
        const fileInfo = fileType === 'csv' ? `a CSV file with headers: ${headers?.join(', ')}` : `an image file`;
        const prompt = `
        You are an expert data scientist explaining your workflow. A user wants to achieve this goal: "${goal}".
        They have provided ${fileInfo} and selected the "${model}" model.

        Generate a detailed, step-by-step explanation of the entire process in Markdown format. Cover the following sections:
        1.  **Data Loading & Initial Analysis:** How the data is loaded and what initial checks are performed.
        2.  **Data Preprocessing & Feature Engineering:** Specific steps taken to clean the data and create features suitable for the model. Be specific to the file type.
        3.  **Model Implementation:** A high-level explanation of how the "${model}" model is trained on the preprocessed data. Include a conceptual Python code snippet using a common library like scikit-learn, pandas, or PyTorch/TensorFlow.
        
        Ensure the explanation is clear, educational, and tailored to the user's goal and data.
        `;
        const response = await ai.models.generateContent({ model: modelAI, contents: prompt });
        return response.text;
    }
    
    // Enhanced prompt for CSV files with complete code generation
    const sampleRows = fileContent.split('\n').slice(0, 5).join('\n'); // Get header + 4 rows
    const prompt = `
You are an expert data scientist tasked with generating a complete, runnable Python code script to achieve a user's goal.

**User's Goal:** "${goal}"
**Selected Model:** "${model}"
**Dataset Type:** CSV

**Dataset Details:**
*   **Columns:** ${headers.join(', ')}
*   **Sample Data (first 5 rows):**
    \`\`\`csv
    ${sampleRows}
    \`\`\`

**Your Task:**
Generate a detailed, step-by-step explanation of the entire process in Markdown format. This explanation MUST be accompanied by a single, complete Python code block that demonstrates the entire workflow. The user should be able to copy and paste this code and run it (assuming they have the full dataset in a file named 'dataset.csv' and the necessary libraries installed).

**The markdown explanation should cover:**
1.  **Setup and Data Loading:** Briefly explain loading the data.
2.  **Data Cleaning & Preprocessing:** Detail the steps taken, such as handling missing values, encoding categorical features (if any), and scaling numerical features. Justify your choices based on the sample data.
3.  **Feature Engineering:** If applicable, describe any new features created.
4.  **Model Training:** Explain the process of splitting the data and training the "${model}".
5.  **Evaluation:** Briefly mention how the model's performance would be evaluated.

**The Python code block should include:**
*   Importing necessary libraries (pandas, scikit-learn).
*   Loading the dataset (e.g., \`pd.read_csv('dataset.csv')\`).
*   A complete data cleaning and preprocessing pipeline. Use \`scikit-learn\`'s \`Pipeline\` and \`ColumnTransformer\` for a clean implementation where appropriate. Make intelligent choices based on the column names and sample data (e.g., use \`OneHotEncoder\` for text columns, \`StandardScaler\` for numeric columns).
*   Intelligently identifying the target variable based on the user's goal of "${goal}".
*   Splitting the data into training and testing sets.
*   Defining and training the specified "${model}".
*   Making predictions on the test set.
*   Printing out some example evaluation metrics relevant to the task (classification or regression).

Structure your response with the Markdown explanation first, followed by the complete Python code inside a fenced code block (\`\`\`python ... \`\`\`).
`;
    const response = await ai.models.generateContent({ model: modelAI, contents: prompt });
    return response.text;
}


export async function generateMetrics(model: string, goal: string, taskType: TaskType): Promise<Metrics> {
  const modelAI = 'gemini-2.5-flash';
  const taskDescription = taskType === TaskType.CLASSIFICATION
    ? "For classification, include accuracy, precision, recall, F1-score, and a 2x2 confusion matrix for a binary case. The values should be between 0.85 and 0.98."
    : "For regression, include R-squared, Mean Squared Error (MSE), and Mean Absolute Error (MAE). R-squared should be between 0.8 and 0.95, and errors should be realistic for a sample problem.";

  const prompt = `
    For a '${model}' model trained for the task of '${goal}', generate a set of realistic but fictional performance metrics.
    ${taskDescription}
    Respond ONLY with a valid JSON object.
  `;
  
  const properties: Record<string, any> = {};
  if (taskType === TaskType.CLASSIFICATION) {
      properties.metrics = {
          type: Type.OBJECT,
          properties: {
              Accuracy: { type: Type.NUMBER },
              Precision: { type: Type.NUMBER },
              Recall: { type: Type.NUMBER },
              'F1-Score': { type: Type.NUMBER },
          }
      };
      properties.confusion_matrix = {
          type: Type.ARRAY,
          items: {
              type: Type.ARRAY,
              items: { type: Type.INTEGER }
          }
      };
  } else { // REGRESSION or OTHER
      properties.metrics = {
          type: Type.OBJECT,
          properties: {
              'R-squared': { type: Type.NUMBER },
              'Mean Squared Error': { type: Type.NUMBER },
              'Mean Absolute Error': { type: Type.NUMBER },
          }
      };
  }

  const response = await ai.models.generateContent({
      model: modelAI,
      contents: prompt,
      config: {
          responseMimeType: "application/json",
          responseSchema: {
              type: Type.OBJECT,
              properties: properties
          }
      }
  });

  const text = response.text.trim();
  try {
      return JSON.parse(text) as Metrics;
  } catch (e) {
      console.error("Failed to parse metrics JSON:", text, e);
      throw new Error("Received invalid format for metrics.");
  }
}

export async function generateSampleInput(headers: string[], csvContent: string, targetColumn: string): Promise<Record<string, string | number>> {
    const model = 'gemini-2.5-flash';
    
    const inputHeaders = headers.filter(h => h !== targetColumn);
    const sampleRows = csvContent.split('\n').slice(1, 4).join('\n');

    const prompt = `
    You are a data generation assistant. Based on the following CSV headers and a few sample rows of data, generate one single, new, and realistic data point that plausibly belongs to the same dataset.
    The user's goal is to predict the '${targetColumn}' column. Therefore, you MUST NOT generate a value for '${targetColumn}'. Generate values ONLY for the input features.

    Input Feature CSV Headers: ${inputHeaders.join(', ')}
    Target Column (DO NOT GENERATE): ${targetColumn}

    Here are some sample rows for context on the data's format and range (including the target for context, but do not generate it in your output):
    ${sampleRows}

    Now, generate a new sample data point containing only the input features.
    Respond ONLY with a valid JSON object where keys are the input feature headers and values are the data for the new sample. Ensure every input feature header is included as a key.
    `;

    const properties = inputHeaders.reduce((acc, header) => {
        // A simple heuristic to determine if a column is likely numeric for the schema
        if (/(id|year|age|count|quantity|number|price|value|score|rate|amount)/i.test(header)) {
            acc[header] = { type: Type.NUMBER };
        } else {
            acc[header] = { type: Type.STRING };
        }
        return acc;
    }, {} as Record<string, { type: Type.STRING | Type.NUMBER }>);

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties,
                required: inputHeaders,
            }
        }
    });

    const text = response.text.trim();
    try {
        return JSON.parse(text) as Record<string, string | number>;
    } catch (e) {
        console.error("Failed to parse sample input JSON:", text, e);
        throw new Error("Received invalid format for sample input.");
    }
}

export async function generatePrediction(goal: string, model: string, sampleInput: string, headers?: string[]): Promise<string> {
    const modelAI = 'gemini-2.5-flash';
    const context = headers ? `The data has these columns: ${headers.join(', ')}.` : '';
    const prompt = `A '${model}' model was trained to '${goal}'. ${context} Given the sample input as a JSON object string: '${sampleInput}', what is a realistic-looking prediction? Keep the response very concise and provide only the predicted value or class label. For example: "Predicted Price: $250,000" or "Classification: Spam".`;
    const response = await ai.models.generateContent({ model: modelAI, contents: prompt });
    return response.text.trim();
}