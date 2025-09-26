import { frappeAPI } from '@shared/api/client';

export interface FinancialMetrics {
    profitability: {
        gross_margin: number;
        operating_margin: number;
        net_margin: number;
        return_on_assets: number;
        return_on_equity: number;
    };
    liquidity: {
        current_ratio: number;
        quick_ratio: number;
        cash_ratio: number;
        working_capital: number;
    };
    efficiency: {
        asset_turnover: number;
        inventory_turnover: number;
        receivables_turnover: number;
        payables_turnover: number;
    };
    leverage: {
        debt_to_equity: number;
        debt_to_assets: number;
        interest_coverage: number;
        equity_multiplier: number;
    };
}

export interface Insight {
    id: string;
    type: 'opportunity' | 'risk' | 'trend' | 'anomaly';
    severity: 'low' | 'medium' | 'high';
    title: string;
    description: string;
    impact: string;
    recommendation: string;
    metrics: Record<string, number>;
    created_at: string;
}

export interface Forecast {
    period: string;
    revenue: {
        predicted: number;
        confidence: number;
        lower_bound: number;
        upper_bound: number;
    };
    expenses: {
        predicted: number;
        confidence: number;
        lower_bound: number;
        upper_bound: number;
    };
    cash_flow: {
        predicted: number;
        confidence: number;
        lower_bound: number;
        upper_bound: number;
    };
    assumptions: string[];
}

class AnalyticsService {
    async calculateFinancialMetrics(companyId: string, period: {
        start_date: string;
        end_date: string;
    }): Promise<FinancialMetrics> {
        // Fetch financial statements
        const [plData, bsData, cfData] = await Promise.all([
            frappeAPI.generateProfitLoss({
                company: companyId,
                from_date: period.start_date,
                to_date: period.end_date
            }),
            frappeAPI.generateBalanceSheet({
                company: companyId,
                to_date: period.end_date
            }),
            frappeAPI.generateCashFlow({
                company: companyId,
                from_date: period.start_date,
                to_date: period.end_date
            })
        ]);

        return this.computeMetrics(plData, bsData, cfData);
    }

    async generateInsights(companyId: string, metrics: FinancialMetrics): Promise<Insight[]> {
        const insights: Insight[] = [];

        // Profitability insights
        if (metrics.profitability.gross_margin < 0.3) {
            insights.push({
                id: `insight-${Date.now()}-1`,
                type: 'risk',
                severity: 'high',
                title: 'Low Gross Margin',
                description: `Gross margin of ${(metrics.profitability.gross_margin * 100).toFixed(1)}% is below industry average`,
                impact: 'Reduced profitability and financial flexibility',
                recommendation: 'Review pricing strategy and cost structure optimization',
                metrics: { current: metrics.profitability.gross_margin, benchmark: 0.3 },
                created_at: new Date().toISOString()
            });
        }

        // Liquidity insights
        if (metrics.liquidity.current_ratio < 1.5) {
            insights.push({
                id: `insight-${Date.now()}-2`,
                type: 'risk',
                severity: metrics.liquidity.current_ratio < 1.0 ? 'high' : 'medium',
                title: 'Liquidity Concern',
                description: `Current ratio of ${metrics.liquidity.current_ratio.toFixed(2)} indicates potential cash flow issues`,
                impact: 'May struggle to meet short-term obligations',
                recommendation: 'Improve cash collection and manage payables strategically',
                metrics: { current: metrics.liquidity.current_ratio, benchmark: 2.0 },
                created_at: new Date().toISOString()
            });
        }

        // Efficiency insights
        if (metrics.efficiency.asset_turnover > 2.0) {
            insights.push({
                id: `insight-${Date.now()}-3`,
                type: 'opportunity',
                severity: 'medium',
                title: 'High Asset Efficiency',
                description: `Asset turnover of ${metrics.efficiency.asset_turnover.toFixed(2)} shows efficient use of assets`,
                impact: 'Strong operational efficiency generating revenue',
                recommendation: 'Maintain current operational excellence and consider expansion',
                metrics: { current: metrics.efficiency.asset_turnover, benchmark: 1.5 },
                created_at: new Date().toISOString()
            });
        }

        return insights;
    }

    async generateForecast(companyId: string, options: {
        forecast_periods: number;
        method: 'linear' | 'exponential' | 'seasonal';
        confidence_level: number;
    }): Promise<Forecast[]> {
        // Get historical data
        const historicalData = await this.getHistoricalData(companyId, 24); // 24 months

        // Simple linear regression for demonstration
        return this.computeForecast(historicalData, options);
    }

    async detectAnomalies(companyId: string): Promise<Insight[]> {
        const anomalies: Insight[] = [];
        
        // Get recent transaction data
        const recentData = await this.getRecentTransactionData(companyId);
        
        // Statistical anomaly detection
        const anomalyThreshold = 2.5; // Z-score threshold
        
        recentData.forEach(transaction => {
            const zScore = this.calculateZScore(transaction.amount, recentData.map(t => t.amount));
            
            if (Math.abs(zScore) > anomalyThreshold) {
                anomalies.push({
                    id: `anomaly-${transaction.id}`,
                    type: 'anomaly',
                    severity: Math.abs(zScore) > 3 ? 'high' : 'medium',
                    title: 'Unusual Transaction Amount',
                    description: `Transaction amount ${transaction.amount} is significantly different from typical amounts`,
                    impact: 'May indicate data entry error or unusual business activity',
                    recommendation: 'Review transaction details and verify accuracy',
                    metrics: { amount: transaction.amount, z_score: zScore },
                    created_at: new Date().toISOString()
                });
            }
        });

        return anomalies;
    }

    async getBenchmarkData(industry: string, companySize: 'small' | 'medium' | 'large'): Promise<FinancialMetrics> {
        // Mock benchmark data - in production this would come from industry databases
        const benchmarks: Record<string, Record<string, Partial<FinancialMetrics>>> = {
            'technology': {
                'small': {
                    profitability: {
                        gross_margin: 0.65,
                        operating_margin: 0.15,
                        net_margin: 0.12,
                        return_on_assets: 0.08,
                        return_on_equity: 0.18
                    }
                }
            },
            'retail': {
                'medium': {
                    profitability: {
                        gross_margin: 0.35,
                        operating_margin: 0.08,
                        net_margin: 0.05,
                        return_on_assets: 0.12,
                        return_on_equity: 0.15
                    }
                }
            }
        };

        return benchmarks[industry]?.[companySize] as FinancialMetrics || this.getDefaultBenchmarks();
    }

    private computeMetrics(plData: any, bsData: any, cfData: any): FinancialMetrics {
        // Extract key figures from financial statements
        const revenue = plData.revenue || 0;
        const cogs = plData.cost_of_goods_sold || 0;
        const operating_income = plData.operating_income || 0;
        const net_income = plData.net_income || 0;
        const total_assets = bsData.total_assets || 1;
        const current_assets = bsData.current_assets || 0;
        const current_liabilities = bsData.current_liabilities || 1;
        const total_debt = bsData.total_debt || 0;
        const total_equity = bsData.total_equity || 1;

        return {
            profitability: {
                gross_margin: revenue > 0 ? (revenue - cogs) / revenue : 0,
                operating_margin: revenue > 0 ? operating_income / revenue : 0,
                net_margin: revenue > 0 ? net_income / revenue : 0,
                return_on_assets: total_assets > 0 ? net_income / total_assets : 0,
                return_on_equity: total_equity > 0 ? net_income / total_equity : 0
            },
            liquidity: {
                current_ratio: current_liabilities > 0 ? current_assets / current_liabilities : 0,
                quick_ratio: current_liabilities > 0 ? (current_assets * 0.8) / current_liabilities : 0,
                cash_ratio: current_liabilities > 0 ? (current_assets * 0.3) / current_liabilities : 0,
                working_capital: current_assets - current_liabilities
            },
            efficiency: {
                asset_turnover: total_assets > 0 ? revenue / total_assets : 0,
                inventory_turnover: 6, // Mock data
                receivables_turnover: 8, // Mock data
                payables_turnover: 4 // Mock data
            },
            leverage: {
                debt_to_equity: total_equity > 0 ? total_debt / total_equity : 0,
                debt_to_assets: total_assets > 0 ? total_debt / total_assets : 0,
                interest_coverage: 5, // Mock data
                equity_multiplier: total_equity > 0 ? total_assets / total_equity : 0
            }
        };
    }

    private async getHistoricalData(companyId: string, months: number) {
        // Mock historical data generation
        const data = [];
        const baseRevenue = 100000;
        const baseExpenses = 70000;
        
        for (let i = months; i > 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            
            data.push({
                period: date.toISOString().substring(0, 7),
                revenue: baseRevenue * (1 + (Math.random() - 0.5) * 0.2) * (1 + i * 0.02),
                expenses: baseExpenses * (1 + (Math.random() - 0.5) * 0.15) * (1 + i * 0.015),
                cash_flow: (Math.random() - 0.3) * 20000
            });
        }
        
        return data;
    }

    private computeForecast(historicalData: any[], options: any): Forecast[] {
        const forecasts: Forecast[] = [];
        
        // Simple linear trend calculation
        const revenues = historicalData.map(d => d.revenue);
        const expenses = historicalData.map(d => d.expenses);
        
        const revenueSlope = this.calculateSlope(revenues);
        const expenseSlope = this.calculateSlope(expenses);
        
        const lastRevenue = revenues[revenues.length - 1];
        const lastExpense = expenses[expenses.length - 1];
        
        for (let i = 1; i <= options.forecast_periods; i++) {
            const nextDate = new Date();
            nextDate.setMonth(nextDate.getMonth() + i);
            
            const predictedRevenue = lastRevenue + (revenueSlope * i);
            const predictedExpense = lastExpense + (expenseSlope * i);
            const predictedCashFlow = predictedRevenue - predictedExpense;
            
            const confidenceAdjustment = Math.max(0.5, 0.9 - (i * 0.1));
            
            forecasts.push({
                period: nextDate.toISOString().substring(0, 7),
                revenue: {
                    predicted: predictedRevenue,
                    confidence: confidenceAdjustment,
                    lower_bound: predictedRevenue * 0.85,
                    upper_bound: predictedRevenue * 1.15
                },
                expenses: {
                    predicted: predictedExpense,
                    confidence: confidenceAdjustment,
                    lower_bound: predictedExpense * 0.90,
                    upper_bound: predictedExpense * 1.10
                },
                cash_flow: {
                    predicted: predictedCashFlow,
                    confidence: confidenceAdjustment,
                    lower_bound: predictedCashFlow * 0.80,
                    upper_bound: predictedCashFlow * 1.20
                },
                assumptions: [
                    'Historical growth trends continue',
                    'No major market disruptions',
                    'Current business model remains unchanged'
                ]
            });
        }
        
        return forecasts;
    }

    private async getRecentTransactionData(companyId: string) {
        // Mock recent transaction data
        return Array.from({ length: 100 }, (_, i) => ({
            id: `txn-${i}`,
            amount: 1000 + Math.random() * 5000,
            date: new Date().toISOString()
        }));
    }

    private calculateSlope(values: number[]): number {
        const n = values.length;
        const sumX = (n * (n + 1)) / 2;
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = values.reduce((sum, y, x) => sum + (x + 1) * y, 0);
        const sumXX = (n * (n + 1) * (2 * n + 1)) / 6;
        
        return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    }

    private calculateZScore(value: number, dataset: number[]): number {
        const mean = dataset.reduce((a, b) => a + b, 0) / dataset.length;
        const stdDev = Math.sqrt(
            dataset.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dataset.length
        );
        return stdDev > 0 ? (value - mean) / stdDev : 0;
    }

    private getDefaultBenchmarks(): FinancialMetrics {
        return {
            profitability: {
                gross_margin: 0.40,
                operating_margin: 0.10,
                net_margin: 0.08,
                return_on_assets: 0.06,
                return_on_equity: 0.15
            },
            liquidity: {
                current_ratio: 2.0,
                quick_ratio: 1.5,
                cash_ratio: 0.5,
                working_capital: 50000
            },
            efficiency: {
                asset_turnover: 1.5,
                inventory_turnover: 6,
                receivables_turnover: 8,
                payables_turnover: 4
            },
            leverage: {
                debt_to_equity: 0.5,
                debt_to_assets: 0.3,
                interest_coverage: 5,
                equity_multiplier: 1.8
            }
        };
    }
}

export const analyticsService = new AnalyticsService();
export default AnalyticsService;