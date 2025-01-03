const { CalimeroSDK } = require('@calimero/sdk');
const crypto = require('crypto');

class VoterRegistry {
    constructor(calimeroConfig) {
        this.calimero = new CalimeroSDK(calimeroConfig);
        this.registeredVoters = new Map();
    }

    async registerVoter(voterIdentity, publicKey) {
        // Create anonymous voter credential
        const credential = await this.generateVoterCredential(voterIdentity);
        
        // Store encrypted voter data using Calimero
        const encryptedData = await this.calimero.encrypt({
            data: {
                identity: voterIdentity,
                credential: credential
            },
            publicKey: publicKey
        });

        const voterId = crypto.randomBytes(32).toString('hex');
        this.registeredVoters.set(voterId, encryptedData);

        return {
            voterId,
            credential
        };
    }

    async verifyVoterCredential(voterId, credential) {
        const encryptedData = this.registeredVoters.get(voterId);
        if (!encryptedData) return false;

        const decryptedData = await this.calimero.decrypt(encryptedData);
        return decryptedData.credential === credential;
    }

    async generateVoterCredential(voterIdentity) {
        // Generate a unique credential that doesn't reveal voter identity
        const salt = crypto.randomBytes(16).toString('hex');
        return crypto
            .createHash('sha256')
            .update(voterIdentity + salt)
            .digest('hex');
    }

    async revokeVoterRegistration(voterId) {
        return this.registeredVoters.delete(voterId);
    }
}

module.exports = VoterRegistry;
