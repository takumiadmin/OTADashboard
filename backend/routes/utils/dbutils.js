import { DynamoDBClient, ScanCommand, PutItemCommand, UpdateItemCommand, GetItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { encryptPassword } from "./cryptoutils.js"; // Ensure this function exists

const dynamoDBClient = new DynamoDBClient({ region: "ap-south-1" }); // Replace with your AWS region
const tableName = "tmcdevuserdb";

export const getAuthenticatedUsername = (req) => {
    return req.user?.username || null;
};

export const getUserFromDB = async (username) => {
    try {
        const command = new ScanCommand({
            TableName: tableName,
            FilterExpression: "#userid = :username",
            ExpressionAttributeNames: {
                "#userid": "userid"
            },
            ExpressionAttributeValues: {
                ":username": { S: username }
            }
        });
        const { Items } = await dynamoDBClient.send(command);
        if (!Items || Items.length === 0) return null;
        const userData = Items[0];
        return {
            username: userData.userid.S,
            password: userData.password.S,
            company: userData.company ? userData.company.S : "", // Fetch company
            defaultpasswordchanged: userData.defaultpasswordchanged ? userData.defaultpasswordchanged.S : "false", // Fetch defaultpasswordchanged
            loginattempts: userData.loginattempts ? parseInt(userData.loginattempts.N, 10) : 0 // Fetch loginattempts
        };
    } catch (error) {
        console.error("❌ DynamoDB fetch error:", error);
        throw new Error("Database error");
    }
};

export const get_device_types = async (username) => {
    try {
        if (!username) {
            throw new Error("Username is required");
        }

        // Get company name for the user
        const companyName = await getCompanyByUsername(username);
        if (!companyName) {
            throw new Error(`Company not found for user: ${username}`);
        }

        console.log(`✅ Company found: ${companyName}`);

        // Fetch device types for that company
        const deviceTypes = await get_items_by_attributes("tmcdevdevicedb", "devicetype", { company: companyName });

        console.log(`✅ Device types fetched:`, deviceTypes);

        return [...new Set(deviceTypes)];
    } catch (error) {
        console.error("❌ Error fetching device types for company:", error);
        throw new Error("Database error");
    }
};

export const get_items_by_attributes = async (table_name, projection_attribute, attributes) => {
    try {
        const filterExpressions = [];
        const expressionAttributeValues = {};
        const expressionAttributeNames = {};

        Object.entries(attributes).forEach(([key, value], index) => {
            const attrKey = `#attr${index}`;
            const attrValue = `:val${index}`;
            filterExpressions.push(`${attrKey} = ${attrValue}`);
            expressionAttributeNames[attrKey] = key;
            expressionAttributeValues[attrValue] = { S: value };
        });

        const command = new ScanCommand({
            TableName: table_name,
            FilterExpression: filterExpressions.join(" AND "),
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ProjectionExpression: projection_attribute
        });

        const { Items } = await dynamoDBClient.send(command);
        return Items.map(item => item[projection_attribute]?.S || null);
    } catch (error) {
        console.error("❌ Error fetching items by attributes:", error);
        throw new Error("Database error");
    }
};

export const get_all_items = async (table_name, attribute_key) => {
    try {
        const command = new ScanCommand({ TableName: table_name });
        const { Items } = await dynamoDBClient.send(command);
        return Items.map(item => item[attribute_key]?.S || null);
    } catch (error) {
        console.error("❌ Error fetching all items:", error);
        throw new Error("Database error");
    }
};

export const get_item = async (table_name, key, key_value) => {
    try {
        const command = new ScanCommand({
            TableName: table_name,
            FilterExpression: "#key = :key_value",
            ExpressionAttributeNames: { "#key": key },
            ExpressionAttributeValues: { ":key_value": { S: key_value } }
        });
        const { Items } = await dynamoDBClient.send(command);
        return Items;
    } catch (error) {
        console.error("❌ Error fetching item:", error);
        throw new Error("Database error");
    }
};

export const put_item = async (table_name, item) => {
    try {
        const command = new PutItemCommand({ TableName: table_name, Item: item });
        await dynamoDBClient.send(command);
        return true;
    } catch (error) {
        console.error("❌ Error inserting item:", error);
        throw new Error("Database error");
    }
};

export const delete_item = async (table_name, partition_key, partition_value, sort_key, sort_key_value) => {
    try {
        const command = new DeleteItemCommand({
            TableName: table_name,
            Key: {
                [partition_key]: { S: partition_value },
                [sort_key]: { S: sort_key_value }
            }
        });
        const response = await dynamoDBClient.send(command);
        return response.$metadata.httpStatusCode === 200;
    } catch (error) {
        console.error("❌ Error deleting item:", error);
        throw new Error("Database error");
    }
};

export const update_item = async (table_name, partition_key, partition_value, sort_key, sort_key_value, attribute, attribute_value) => {
    try {
        const command = new UpdateItemCommand({
            TableName: table_name,
            Key: {
                [partition_key]: { S: partition_value },
                [sort_key]: { S: sort_key_value }
            },
            UpdateExpression: `SET #attr = :val`,
            ExpressionAttributeNames: { "#attr": attribute },
            ExpressionAttributeValues: { ":val": { S: attribute_value } },
            ConditionExpression: `attribute_exists(${partition_key}) AND attribute_exists(${sort_key})`
        });
        const response = await dynamoDBClient.send(command);
        return response.$metadata.httpStatusCode === 200;
    } catch (error) {
        console.error("❌ Error updating item:", error);
        throw new Error("Database error");
    }
};

export const get_item_value = async (table_name, partition_key, partition_value, sort_key, sort_value, column_name) => {
    try {
        const command = new GetItemCommand({
            TableName: table_name,
            Key: {
                [partition_key]: { S: partition_value },
                [sort_key]: { S: sort_value }
            }
        });
        const { Item } = await dynamoDBClient.send(command);
        return Item && Item[column_name] ? Item[column_name].S : null;
    } catch (error) {
        console.error("❌ Error fetching column value:", error);
        throw new Error("Database error");
    }
};

export const updateUserPassword = async (username, newPassword) => {
    try {
        // Fetch the current user data to get the existing password (sort key) and other attributes
        const user = await getUserFromDB(username);
        if (!user) {
            throw new Error("User not found");
        }

        // Delete the existing item
        const deleteCommand = new DeleteItemCommand({
            TableName: "tmcdevuserdb",
            Key: {
                "userid": { S: username },
                "password": { S: user.password } // Use the current encrypted password
            }
        });
        await dynamoDBClient.send(deleteCommand);
        console.log(`✅ Existing item deleted for ${username}`);

        // Encrypt the new password
        const encryptedNewPassword = await encryptPassword(newPassword);
        console.log(`🔍 New password encrypted: ${encryptedNewPassword} (length: ${encryptedNewPassword.length})`);

        // Create a new item with the updated password and preserved attributes
        const newItem = {
            userid: { S: username },
            password: { S: encryptedNewPassword },
            company: { S: user.company }, // Preserve company as a String
            defaultpasswordchanged: { S: "true" }, // Update to "true" as a String
            loginattempts: { N: user.loginattempts.toString() } // Preserve loginattempts
        };

        // Add the new item
        const putCommand = new PutItemCommand({
            TableName: "tmcdevuserdb",
            Item: newItem
        });
        await dynamoDBClient.send(putCommand);
        console.log(`✅ New item added for ${username} with updated password`);

        return true;
    } catch (error) {
        console.error("❌ Error updating password:", error);
        return false;
    }
};

export async function add_firmware_entry(firmwareData) {
    if (!firmwareData.devicetype) {
        console.error("❌ Error: 'devicetype' is missing from firmwareData!", firmwareData);
        return;
    }

    const params = {
        TableName: "tmcdevfirmwaredb",
        Item: marshall(firmwareData, { removeUndefinedValues: true})  
    };

    try {
        await dynamoDBClient.send(new PutItemCommand(params));
        console.log("✅ Firmware entry added to DynamoDB:", params.Item);
    } catch (error) {
        console.error("❌ Error adding entry to DynamoDB:", error);
        throw error;
    }
};

export const getCompanyByUsername = async (username) => {
    if (!username) {
        throw new Error("Username is required");
    }

    try {
        const command = new ScanCommand({
            TableName: tableName,
            FilterExpression: "#userid = :username",
            ExpressionAttributeNames: {
                "#userid": "userid",
            },
            ExpressionAttributeValues: {
                ":username": { S: username },
            },
            ProjectionExpression: "company", // Fetch only the company attribute
        });

        const { Items } = await dynamoDBClient.send(command);

        if (!Items || Items.length === 0 || !Items[0].company) {
            console.warn(`⚠ No company found for user: ${username}`);
            return null;
        }

        return Items[0].company.S;
    } catch (error) {
        console.error("❌ Error fetching company name:", error);
        throw new Error("Database error");
    }
};

export const updateLoginAttempts = async (username, currentPassword, attempts) => {
    try {
        const command = new UpdateItemCommand({
            TableName: tableName,
            Key: {
                "userid": { S: username },
                "password": { S: currentPassword } // Use the current password as the sort key
            },
            UpdateExpression: "SET loginattempts = :attempts",
            ExpressionAttributeValues: { ":attempts": { N: attempts.toString() } },
            ConditionExpression: "attribute_exists(userid) AND attribute_exists(password)" // Ensures the user and password combination exists
        });
        const response = await dynamoDBClient.send(command);
        console.log(`✅ Login attempts updated for ${username} to ${attempts}`);
        return response.Attributes;
    } catch (error) {
        console.error("❌ Error updating login attempts:", error);
        if (error.name === 'ValidationException') {
            console.error("🔍 Key schema mismatch or password mismatch. Verify the current password.");
        }
        throw new Error("Database error");
    }
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////


// Equivalent to DBUtils class initialization (not needed as a class in JS, using module-level client)
export const dbUtils = {
    // Equivalent to get_items_by_attributes
    getItemsByAttributes: async (tableName, projectionAttribute, attributes) => {
        try {
            const filterExpressions = [];
            const expressionAttributeValues = {};
            const expressionAttributeNames = {};

            Object.entries(attributes).forEach(([key, value], index) => {
                const attrKey = `#attr${index}`;
                const attrValue = `:val${index}`;
                filterExpressions.push(`${attrKey} = ${attrValue}`);
                expressionAttributeNames[attrKey] = key;
                expressionAttributeValues[attrValue] = { S: value };
            });

            const command = new ScanCommand({
                TableName: tableName,
                FilterExpression: filterExpressions.join(" AND "),
                ExpressionAttributeNames: expressionAttributeNames,
                ExpressionAttributeValues: expressionAttributeValues,
                ProjectionExpression: projectionAttribute
            });

            const { Items } = await dynamoDBClient.send(command);
            return Items.map(item => item[projectionAttribute]?.S || null);
        } catch (error) {
            console.error("❌ Error in getItemsByAttributes:", error);
            throw new Error(`Error fetching items: ${error.message}`);
        }
    },

    // Equivalent to get_all_items
    getAllItems: async (tableName, attributeKey) => {
        try {
            const command = new ScanCommand({ TableName: tableName });
            const { Items } = await dynamoDBClient.send(command);
            return Items.map(item => item[attributeKey]?.S || null);
        } catch (error) {
            console.error("❌ Error in getAllItems:", error);
            throw new Error(`Error fetching all items: ${error.message}`);
        }
    },

    // Equivalent to get_item (using Query instead of Scan for key-based lookup)
    getItem: async (tableName, key, keyValue) => {
        try {
            const command = new QueryCommand({
                TableName: tableName,
                KeyConditionExpression: "#key = :keyValue",
                ExpressionAttributeNames: { "#key": key },
                ExpressionAttributeValues: { ":keyValue": { S: keyValue } }
            });
            const { Items } = await dynamoDBClient.send(command);
            return Items || [];
        } catch (error) {
            console.error("❌ Error in getItem:", error);
            throw new Error(`Error fetching item: ${error.message}`);
        }
    },

    // Equivalent to put_item
    putItem: async (tableName, item) => {
        try {
            const command = new PutItemCommand({
                TableName: tableName,
                Item: marshall(item, { removeUndefinedValues: true })
            });
            await dynamoDBClient.send(command);
            return true;
        } catch (error) {
            console.error("❌ Error in putItem:", error);
            throw new Error(`Error inserting item: ${error.message}`);
        }
    },

    // Equivalent to delete_item
    deleteItem: async (tableName, partitionKey, partitionValue, sortKey, sortKeyValue) => {
        try {
            const command = new DeleteItemCommand({
                TableName: tableName,
                Key: {
                    [partitionKey]: { S: partitionValue },
                    [sortKey]: { S: sortKeyValue }
                }
            });
            const response = await dynamoDBClient.send(command);
            return response.$metadata.httpStatusCode === 200;
        } catch (error) {
            console.error("❌ Error in deleteItem:", error);
            throw new Error(`Error deleting item: ${error.message}`);
        }
    },

    // Equivalent to update_item
    updateItem: async (tableName, partitionKey, partitionValue, sortKey, sortKeyValue, attribute, attributeValue) => {
        try {
            const command = new UpdateItemCommand({
                TableName: tableName,
                Key: {
                    [partitionKey]: { S: partitionValue },
                    [sortKey]: { S: sortKeyValue }
                },
                UpdateExpression: `SET #attr = :val`,
                ExpressionAttributeNames: { "#attr": attribute },
                ExpressionAttributeValues: { ":val": { S: attributeValue } },
                ConditionExpression: `attribute_exists(${partitionKey}) AND attribute_exists(${sortKey})`
            });
            const response = await dynamoDBClient.send(command);
            return response.$metadata.httpStatusCode === 200;
        } catch (error) {
            console.error("❌ Error in updateItem:", error);
            throw new Error(`Error updating item: ${error.message}`);
        }
    },

    // Equivalent to get_item_value
    getItemValue: async (tableName, partitionKey, partitionValue, sortKey, sortValue, columnName) => {
        try {
            const command = new GetItemCommand({
                TableName: tableName,
                Key: {
                    [partitionKey]: { S: partitionValue },
                    [sortKey]: { S: sortValue }
                }
            });
            const { Item } = await dynamoDBClient.send(command);
            return Item && Item[columnName] ? Item[columnName].S : null;
        } catch (error) {
            console.error("❌ Error in getItemValue:", error);
            throw new Error(`Error fetching item value: ${error.message}`);
        }
    }
};

// Standalone functions equivalent to get_all_items and get_selected_items
export const getAllItemsStandalone = async (tableName) => {
    try {
        const command = new ScanCommand({ TableName: tableName });
        const { Items } = await dynamoDBClient.send(command);
        return Items || [];
    } catch (error) {
        console.error("❌ Error in getAllItemsStandalone:", error);
        throw new Error(`Error fetching data: ${error.message}`);
    }
};

export const getSelectedItems = async (tableName, deviceId, selectedParameters) => {
    try {
        const command = new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: "#deviceid = :deviceId",
            ExpressionAttributeNames: { "#deviceid": "deviceid" },
            ExpressionAttributeValues: { ":deviceId": { S: deviceId } }
        });
        const { Items } = await dynamoDBClient.send(command);
        let items = Items || [];

        if (selectedParameters && selectedParameters.length > 0) {
            const requiredFields = ["deviceid", "timestamp"];
            const allFields = [...new Set([...requiredFields, ...selectedParameters])];
            items = items.map(item => {
                const filteredItem = {};
                allFields.forEach(field => {
                    if (item[field]) {
                        filteredItem[field] = item[field];
                    }
                });
                return filteredItem;
            });
        }
        return items;
    } catch (error) {
        console.error("❌ Error in getSelectedItems:", error);
        throw new Error(`Error fetching selected data: ${error.message}`);
    }
};
////////////////////////////////////////////////////////////////////////////////////
