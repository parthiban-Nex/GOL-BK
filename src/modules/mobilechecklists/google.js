import fs from 'fs';
import axios from 'axios';
import { GoogleAuth } from 'google-auth-library';
import mysql from 'mysql2/promise'

/**
 * Get Access Token using Service Account
 */
async function getAccessToken(credentialsFilePath) {
    try {
        const auth = new GoogleAuth({
            keyFile: credentialsFilePath,
            scopes: ['https://www.googleapis.com/auth/cloud-platform']
        });

        
        const client = await auth.getClient();
        // console.log("client", client)
        const tokenResponse = await client.getAccessToken();

        return tokenResponse.token;
    } catch (error) {
        console.error('Error getting access token:', error.message);
        return null;
    }
}

/**
 * Call Gemini / Vertex AI API
 */
async function callGeminiApi(endpoint, payload, credentialsFilePath) {
    const accessToken = await getAccessToken(credentialsFilePath);

    console.log("accessToken", accessToken)
    if (!accessToken) {
        return null;
    }

    try {
        const response = await axios.post(endpoint, payload, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        return accessToken;
    } catch (error) {
        console.error('Error calling Gemini API:', error.response?.data || error.message);
        return null;
    }
}

/**
 * Equivalent of PHP AccessToken() function
 */
async function AccessToken() {
    const credentialsFilePath =
        'C:/xampp/htdocs/wordpress/reporting/vrm/gcp_cred/prj-tvs-prod-dms-bcad97ad50b8.json';

    const endpoint =
        'https://us-central1-aiplatform.googleapis.com/v1/projects/prj-tvs-prod-dms/locations/us-central1/endpoints/1479218072823791616:generateContent'

    const requestPayload = {
        contents: [
            {
                role: 'user',
                parts: [
                    { text: "userText" }
                ]
            }
        ],
        generationConfig: {
            maxOutputTokens: 512,
            temperature: 0.3,
            topP: 0.95
        }
    };

    const result = await callGeminiApi(endpoint, requestPayload, credentialsFilePath);

    if (!result) return null;

    return result;
}

const GoogleController = {
    AccessToken
}

export default GoogleController;
