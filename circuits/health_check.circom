pragma circom 2.1.9;

include "../node_modules/circomlib/circuits/comparators.circom";

template HealthCheck() {
    signal input collateralUsd;
    signal input debtUsd;
    signal input minCollateralRatioBps;

    signal output isHealthy;

    signal lhs;
    signal rhs;

    lhs <== collateralUsd * 10000;
    rhs <== debtUsd * minCollateralRatioBps;

    // Assert collateral/debt >= minCollateralRatioBps/10000.
    component lt = LessThan(200);
    lt.in[0] <== lhs;
    lt.in[1] <== rhs;

    isHealthy <== 1 - lt.out;
    isHealthy === 1;
}

component main = HealthCheck();
