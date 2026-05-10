import status from "http-status";
import { Role, UserStatus, ProductStatus, SubscriptionStatus } from "../../../../generated/prisma/index.js";
import AppError from "../../errorHelpers/AppError";
import { IRequestUser } from "../../interfaces/requestUser.inteface";
import { prisma } from "../../lib/prisma";

const getDashboardStatsData = async (user: IRequestUser) => {
    let statsData;

    switch (user.role) {
        case Role.SUPER_ADMIN:
            statsData = await getSuperAdminStatsData();
            break;
        case Role.ADMIN:
            statsData = await getAdminStatsData();
            break;
        case Role.MODERATOR:
            statsData = await getModeratorStatsData();
            break;
        default:
            throw new AppError(status.BAD_REQUEST, "Invalid user role");
    }

    return statsData;
}

const getModeratorStatsData = async () => {
    // Product status counts
    const approved = await prisma.product.count({
        where: { status: ProductStatus.APPROVED, isDeleted: false }
    });

    const pending = await prisma.product.count({
        where: { status: ProductStatus.PENDING, isDeleted: false }
    });

    const rejected = await prisma.product.count({
        where: { status: ProductStatus.REJECTED, isDeleted: false }
    });

    const featured = await prisma.product.count({
        where: { isFeatured: true, isDeleted: false }
    });

    const reported = await prisma.product.count({
        where: { reportedStatus: true, isDeleted: false }
    });

    return {
        productStats: {
            approved,
            pending,
            rejected,
            featured,
            reported
        }
    };
}

const getSuperAdminStatsData = async () => {
    // Product stats
    const approvedProductCount = await prisma.product.count({
        where: {
            status: ProductStatus.APPROVED,
            isDeleted: false
        }
    });

    const pendingProductCount = await prisma.product.count({
        where: {
            status: ProductStatus.PENDING,
            isDeleted: false
        }
    });

    const rejectedProductCount = await prisma.product.count({
        where: {
            status: ProductStatus.REJECTED,
            isDeleted: false
        }
    });

    const totalProductCount = await prisma.product.count({
        where: {
            isDeleted: false
        }
    });

    // User stats
    const activeUserCount = await prisma.user.count({
        where: {
            status: UserStatus.ACTIVE
        }
    });

    const inactiveUserCount = await prisma.user.count({
        where: {
            status: UserStatus.INACTIVE
        }
    });

    const suspendedUserCount = await prisma.user.count({
        where: {
            status: UserStatus.SUSPENDED
        }
    });

    const totalUserCount = await prisma.user.count();

    // Admin stats
    const activeAdminCount = await prisma.admin.count({
        where: {
            isDeleted: false
        }
    });

    const inactiveAdminCount = await prisma.admin.count({
        where: {
            isDeleted: true
        }
    });

    // Moderator stats
    const activeModeratorCount = await prisma.moderator.count({
        where: {
            isDeleted: false
        }
    });

    const inactiveModeratorCount = await prisma.moderator.count({
        where: {
            isDeleted: true
        }
    });

    // Subscription stats
    const verifiedSubscriberCount = await prisma.subscriber.count({
        where: {
            status: SubscriptionStatus.VERIFIED
        }
    });

    const pendingSubscriberCount = await prisma.subscriber.count({
        where: {
            status: SubscriptionStatus.PENDING
        }
    });

    // Vote stats
    const totalVoteCount = await prisma.productVote.count();

    // Report stats
    const totalReportCount = await prisma.productReport.count();

    // Review stats
    const totalReviewCount = await prisma.review.count();

    // Revenue stats
    const totalRevenue = await prisma.payment.aggregate({
        _sum: { price: true }
    });

    const totalPaymentCount = await prisma.payment.count();

    // Chart data
    const pieChartData = await getProductStatusPieChartData();
    const barChartData = await getProductCreationBarChartData();

    return {
        productStats: {
            approved: approvedProductCount,
            pending: pendingProductCount,
            rejected: rejectedProductCount,
            total: totalProductCount
        },
        userStats: {
            active: activeUserCount,
            inactive: inactiveUserCount,
            suspended: suspendedUserCount,
            total: totalUserCount
        },
        adminStats: {
            active: activeAdminCount,
            inactive: inactiveAdminCount
        },
        moderatorStats: {
            active: activeModeratorCount,
            inactive: inactiveModeratorCount
        },
        subscriptionStats: {
            verified: verifiedSubscriberCount,
            pending: pendingSubscriberCount
        },
        engagementStats: {
            totalVotes: totalVoteCount,
            totalReports: totalReportCount,
            totalReviews: totalReviewCount
        },
        revenueStats: {
            totalRevenue: totalRevenue._sum.price || 0,
            totalPayments: totalPaymentCount
        },
        pieChartData,
        barChartData
    }
}

const getAdminStatsData = async () => {
    // Product stats
    const approvedProductCount = await prisma.product.count({
        where: {
            status: ProductStatus.APPROVED,
            isDeleted: false
        }
    });

    const pendingProductCount = await prisma.product.count({
        where: {
            status: ProductStatus.PENDING,
            isDeleted: false
        }
    });

    const rejectedProductCount = await prisma.product.count({
        where: {
            status: ProductStatus.REJECTED,
            isDeleted: false
        }
    });

    const totalProductCount = await prisma.product.count({
        where: {
            isDeleted: false
        }
    });

    // User stats
    const activeUserCount = await prisma.user.count({
        where: {
            status: UserStatus.ACTIVE
        }
    });

    const inactiveUserCount = await prisma.user.count({
        where: {
            status: UserStatus.INACTIVE
        }
    });

    const suspendedUserCount = await prisma.user.count({
        where: {
            status: UserStatus.SUSPENDED
        }
    });

    const totalUserCount = await prisma.user.count();

    // Subscription stats
    const verifiedSubscriberCount = await prisma.subscriber.count({
        where: {
            status: SubscriptionStatus.VERIFIED
        }
    });

    const pendingSubscriberCount = await prisma.subscriber.count({
        where: {
            status: SubscriptionStatus.PENDING
        }
    });

    // Vote and Review stats
    const totalVoteCount = await prisma.productVote.count();
    const totalReviewCount = await prisma.review.count();

    // Revenue stats
    const totalRevenue = await prisma.payment.aggregate({
        _sum: { price: true }
    });

    const totalPaymentCount = await prisma.payment.count();

    // Chart data
    const pieChartData = await getProductStatusPieChartData();
    const barChartData = await getProductCreationBarChartData();

    return {
        productStats: {
            approved: approvedProductCount,
            pending: pendingProductCount,
            rejected: rejectedProductCount,
            total: totalProductCount
        },
        userStats: {
            active: activeUserCount,
            inactive: inactiveUserCount,
            suspended: suspendedUserCount,
            total: totalUserCount
        },
        subscriptionStats: {
            verified: verifiedSubscriberCount,
            pending: pendingSubscriberCount
        },
        engagementStats: {
            totalVotes: totalVoteCount,
            totalReviews: totalReviewCount
        },
        revenueStats: {
            totalRevenue: totalRevenue._sum.price || 0,
            totalPayments: totalPaymentCount
        },
        pieChartData,
        barChartData
    }
}









const getProductStatusPieChartData = async () => {
    const productStatusDistribution = await prisma.product.groupBy({
        by: ["status"],
        _count: {
            id: true
        }
    });

    const formattedProductStatusDistribution = productStatusDistribution.map(({ _count, status }) => ({
        status,
        count: _count.id
    }));

    return formattedProductStatusDistribution;
}

const getProductCreationBarChartData = async () => {
    interface ProductCountByMonth {
        month: Date;
        count: bigint;
    }
    const productCountByMonth: ProductCountByMonth[] = await prisma.$queryRaw`
        SELECT DATE_TRUNC('month', "createdAt") AS month,
        CAST(COUNT(*) AS INTEGER) AS count
        FROM "product"
        GROUP BY month
        ORDER BY month ASC;
    `;

    return productCountByMonth;
}

const getUserLeaderboard = async () => {
    // 1. First, get the top 6 user IDs based on approved product count using grouping
    const topContributors = await prisma.product.groupBy({
        by: ['ownerId'],
        where: {
            status: ProductStatus.APPROVED,
            isDeleted: false,
            owner: {
                status: UserStatus.ACTIVE,
                isDeleted: false,
            }
        },
        _count: {
            id: true
        },
        orderBy: {
            _count: {
                id: 'desc'
            }
        },
        take: 6
    });

    if (topContributors.length === 0) {
        return [];
    }

    const userIds = topContributors.map(c => c.ownerId);

    // 2. Fetch full user details for these IDs
    const users = await prisma.user.findMany({
        where: {
            id: { in: userIds }
        },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            profilePhoto: true,
            _count: {
                select: {
                    products: {
                        where: {
                            status: ProductStatus.APPROVED,
                            isDeleted: false,
                        },
                    },
                },
            },
        }
    });

    // 3. Sort the fetched users to match the leaderboard order
    const leaderboard = users.sort((a, b) => {
        const aCount = a._count?.products || 0;
        const bCount = b._count?.products || 0;
        return bCount - aCount;
    });

    return leaderboard;
}

export const StatsService = {
    getDashboardStatsData,
    getUserLeaderboard
}
