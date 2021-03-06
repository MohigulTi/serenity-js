import { defineSupportCode } from 'cucumber';

enum StepInterface {
    SYNCHRONOUS,
    CALLBACK,
    PROMISE,
}

enum StepResult {
    SUCCESS,
    FAILURE,
    PENDING,
}

function createFailingStep(stepInterface: StepInterface) {
    switch (stepInterface) {
        case StepInterface.CALLBACK:
            return cb => {
                process.nextTick(cb.bind(null, new Error('Assertion failed')));
            };
        case StepInterface.PROMISE:
            return () => {
                return new Promise((resolve, reject) => {
                    process.nextTick(() => {
                        reject(new Error('Assertion failed'));
                    });
                });
            };
        case StepInterface.SYNCHRONOUS:
        default:
            return () => {
                throw new Error('Assertion failed');
            };
    }
}

function createPassingStep(stepInterface: StepInterface, result: StepResult) {
    const resultValue = StepResult[ result ].toLowerCase();
    switch (stepInterface) {
        case StepInterface.CALLBACK:
            return cb => {
                process.nextTick(cb.bind(null, null, resultValue));
            };
        case StepInterface.PROMISE:
            return () => {
                return new Promise(resolve => process.nextTick(() => resolve(resultValue)));
            };
        case StepInterface.SYNCHRONOUS:
        default:
            return () => {
                return resultValue;
            };
    }
}

function createSlowStep(stepInterface: StepInterface, timeout: number) {
    switch (stepInterface) {
        case StepInterface.CALLBACK:
            return cb => {
                setTimeout(cb, timeout);
            };
        case StepInterface.PROMISE:
        default:
            return () => {
                return new Promise(resolve => setTimeout(resolve, timeout));
            };
    }
}

function createStep(stepInterface: StepInterface, result: StepResult) {
    if (result === StepResult.FAILURE) {
        return createFailingStep(stepInterface);
    }
    return createPassingStep(stepInterface, result);
}

defineSupportCode(({ Given }) => {

    Given(/^a step that passes$/,
        createStep(StepInterface.PROMISE, StepResult.SUCCESS));

    Given(/^a step that passes with a synchronous interface$/,
        createStep(StepInterface.SYNCHRONOUS, StepResult.SUCCESS));

    Given(/^a step that passes with a callback interface$/,
        createStep(StepInterface.CALLBACK, StepResult.SUCCESS));

    Given(/^a step that passes with a promise interface$/,
        createStep(StepInterface.PROMISE, StepResult.SUCCESS));

    Given(/^a step that fails with a synchronous interface$/,
        createStep(StepInterface.SYNCHRONOUS, StepResult.FAILURE));

    Given(/^a step that fails with a callback interface$/,
        createStep(StepInterface.CALLBACK, StepResult.FAILURE));

    Given(/^a step that fails with a promise interface$/,
        createStep(StepInterface.PROMISE, StepResult.FAILURE));

    Given(/^a pending step with a synchronous interface$/,
        createStep(StepInterface.SYNCHRONOUS, StepResult.PENDING));

    Given(/^a pending step with a callback interface$/,
        createStep(StepInterface.CALLBACK, StepResult.PENDING));

    Given(/^a pending step with a promise interface$/,
        createStep(StepInterface.PROMISE, StepResult.PENDING));

    Given(/^the following.*$/, data => Promise.resolve());

    Given(/^an example.ts file with the following contents:$/, docstring => Promise.resolve());

    Given(/^a slow, callback step$/, { timeout: 100 }, createSlowStep(StepInterface.CALLBACK, 10000));
    Given(/^a slow, promise step$/, { timeout: 100 },  createSlowStep(StepInterface.PROMISE,  10000));
});
