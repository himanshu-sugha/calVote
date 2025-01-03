import React, { useState } from 'react';
import { useStarknet } from '@starknet-react/core';
import { BallotFactory } from '../contracts/BallotFactory';

const BallotCreation = () => {
    const { account } = useStarknet();
    const [ballotData, setBallotData] = useState({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        options: ['']
    });

    const handleOptionChange = (index, value) => {
        const newOptions = [...ballotData.options];
        newOptions[index] = value;
        setBallotData({ ...ballotData, options: newOptions });
    };

    const addOption = () => {
        setBallotData({
            ...ballotData,
            options: [...ballotData.options, '']
        });
    };

    const createBallot = async () => {
        try {
            const contract = new BallotFactory(process.env.BALLOT_FACTORY_ADDRESS);
            const tx = await contract.createBallot(
                ballotData.title,
                ballotData.description,
                Math.floor(new Date(ballotData.startTime).getTime() / 1000),
                Math.floor(new Date(ballotData.endTime).getTime() / 1000),
                ballotData.options
            );
            await tx.wait();
            alert('Ballot created successfully!');
        } catch (error) {
            console.error('Error creating ballot:', error);
            alert('Failed to create ballot');
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h2 className="text-2xl font-bold mb-4">Create New Ballot</h2>
            <div className="space-y-4">
                <div>
                    <label className="block mb-2">Title</label>
                    <input
                        type="text"
                        value={ballotData.title}
                        onChange={(e) => setBallotData({ ...ballotData, title: e.target.value })}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label className="block mb-2">Description</label>
                    <textarea
                        value={ballotData.description}
                        onChange={(e) => setBallotData({ ...ballotData, description: e.target.value })}
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-2">Start Time</label>
                        <input
                            type="datetime-local"
                            value={ballotData.startTime}
                            onChange={(e) => setBallotData({ ...ballotData, startTime: e.target.value })}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div>
                        <label className="block mb-2">End Time</label>
                        <input
                            type="datetime-local"
                            value={ballotData.endTime}
                            onChange={(e) => setBallotData({ ...ballotData, endTime: e.target.value })}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                </div>
                <div>
                    <label className="block mb-2">Options</label>
                    {ballotData.options.map((option, index) => (
                        <div key={index} className="flex mb-2">
                            <input
                                type="text"
                                value={option}
                                onChange={(e) => handleOptionChange(index, e.target.value)}
                                className="flex-1 p-2 border rounded mr-2"
                                placeholder={`Option ${index + 1}`}
                            />
                        </div>
                    ))}
                    <button
                        onClick={addOption}
                        className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
                    >
                        Add Option
                    </button>
                </div>
                <button
                    onClick={createBallot}
                    className="w-full bg-green-500 text-white px-4 py-2 rounded"
                >
                    Create Ballot
                </button>
            </div>
        </div>
    );
};

export default BallotCreation;
