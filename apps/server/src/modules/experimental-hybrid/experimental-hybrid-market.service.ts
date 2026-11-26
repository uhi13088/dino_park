import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { getParkStorageLimits } from '../economy/park-storage-limits';
import { ParkOperationsService } from '../park/park-operations.service';
import { HYBRID_LINEAGE_SELECT } from './experimental-hybrid-records';

type Tx = Prisma.TransactionClient;
const PUBLICATION_DELAY_MS = 24 * 60 * 60 * 1000;
const MAX_LISTINGS = 80;

@Injectable()
export class ExperimentalHybridMarketService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly operations: ParkOperationsService,
  ) {}

  async ownListings(tx: Tx, parkId: string, now: Date) {
    const listings = await tx.experimentalHybridListing.findMany({
      where: {
        sellerParkId: parkId,
        OR: [
          { activeSlot: { not: null } },
          { listedAt: { gte: new Date(now.getTime() - PUBLICATION_DELAY_MS) } },
        ],
      },
      select: { id: true, lineageId: true, activeSlot: true, listedAt: true },
      orderBy: { listedAt: 'desc' },
    });
    const byLineage = new Map<string, { activeListingId: string | null; onCooldown: boolean }>();
    for (const listing of listings) {
      const old = byLineage.get(listing.lineageId);
      byLineage.set(listing.lineageId, {
        activeListingId: listing.activeSlot ? listing.id : (old?.activeListingId ?? null),
        onCooldown:
          !!old?.onCooldown || now.getTime() - listing.listedAt.getTime() < PUBLICATION_DELAY_MS,
      });
    }
    return byLineage;
  }

  async activeListings(tx: Tx) {
    const listings = await tx.experimentalHybridListing.findMany({
      where: { activeSlot: { not: null } },
      include: {
        lineage: { select: HYBRID_LINEAGE_SELECT },
        sellerPark: { select: { user: { select: { nickname: true } } } },
      },
      orderBy: [{ listedAt: 'desc' }, { id: 'asc' }],
      take: MAX_LISTINGS,
    });
    return listings.map(({ sellerPark, ...listing }) => ({
      listing,
      seller: sellerPark.user.nickname,
    }));
  }

  async pendingProceeds(tx: Tx, parkId: string) {
    const { _sum } = await tx.experimentalHybridListing.aggregate({
      where: { sellerParkId: parkId, soldAt: { not: null } },
      _sum: { price: true, sellerPaidGold: true },
    });
    return (_sum.price ?? 0) - (_sum.sellerPaidGold ?? 0);
  }

  private async sellerSpace(tx: Tx, userId: string, parkId: string, now: Date) {
    const { goldCapacity } = await getParkStorageLimits(tx, parkId, now);
    const { gold } = await tx.currency.findUniqueOrThrow({
      where: { userId },
      select: { gold: true },
    });
    return Math.max(0, goldCapacity - gold);
  }

  async collect(tx: Tx, userId: string, parkId: string, now: Date) {
    let space = await this.sellerSpace(tx, userId, parkId, now);
    if (!space) return;
    const unpaid = await tx.experimentalHybridListing.findMany({
      where: {
        sellerParkId: parkId,
        soldAt: { not: null },
        sellerPaidGold: { lt: tx.experimentalHybridListing.fields.price },
      },
      select: { id: true, price: true, sellerPaidGold: true },
      orderBy: [{ soldAt: 'asc' }, { id: 'asc' }],
    });
    let collected = 0;
    for (const listing of unpaid) {
      const amount = Math.min(space, listing.price - listing.sellerPaidGold);
      await tx.experimentalHybridListing.update({
        where: { id: listing.id },
        data: { sellerPaidGold: { increment: amount } },
      });
      collected += amount;
      space -= amount;
      if (!space) break;
    }
    await this.paySeller(tx, userId, collected, '야시장 판매 대금 수령');
  }

  async list(
    tx: Tx,
    parkId: string,
    lineageId: string,
    price: number,
    requestId: string,
    now: Date,
  ) {
    const existing = await tx.experimentalHybridListing.findUnique({
      where: { sellerParkId_requestId: { sellerParkId: parkId, requestId } },
      select: { id: true },
    });
    if (existing) return;
    const recipe = await tx.experimentalHybridRecipe.findUnique({
      where: { parkId_lineageId: { parkId, lineageId } },
      select: { source: true },
    });
    if (!recipe || recipe.source === 'market')
      throw new BadRequestException('직접 발견하거나 복원한 연구자료의 사본을 발행할 수 있어요.');
    const activeSlot = [parkId, lineageId].join(':');
    const last = await tx.experimentalHybridListing.findFirst({
      where: { sellerParkId: parkId, lineageId },
      select: { listedAt: true, activeSlot: true },
      orderBy: { listedAt: 'desc' },
    });
    if (last?.activeSlot) throw new BadRequestException('이미 이 연구자료를 판매하고 있어요.');
    if (last && now.getTime() - last.listedAt.getTime() < PUBLICATION_DELAY_MS)
      throw new BadRequestException('사본을 발행한 뒤 24시간이 지나면 다시 발행할 수 있어요.');
    await tx.experimentalHybridListing.create({
      data: { sellerParkId: parkId, lineageId, requestId, activeSlot, price, listedAt: now },
    });
  }

  async cancel(tx: Tx, parkId: string, listingId: string, now: Date) {
    const listing = await tx.experimentalHybridListing.findFirst({
      where: { id: listingId, sellerParkId: parkId },
      select: { activeSlot: true, soldAt: true },
    });
    if (!listing) throw new NotFoundException('내 매물을 찾을 수 없어요.');
    if (listing.soldAt) throw new BadRequestException('이미 판매한 매물이에요.');
    if (!listing.activeSlot) return;
    await tx.experimentalHybridListing.updateMany({
      where: { id: listingId, activeSlot: { not: null } },
      data: { activeSlot: null, cancelledAt: now },
    });
  }

  async purchase<T>(
    buyerUserId: string,
    listingId: string,
    response: (tx: Tx, now: Date) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const initial = await tx.experimentalHybridListing.findUnique({
        where: { id: listingId },
        select: { sellerPark: { select: { userId: true } } },
      });
      if (!initial) throw new NotFoundException('판매 자료를 찾을 수 없어요.');
      const sellerUserId = initial.sellerPark.userId;
      if (buyerUserId === sellerUserId) throw new BadRequestException('내 매물이에요.');
      const now = new Date();
      // Trade touches two wallets. Every transfer takes park and currency locks
      // in the same player order, including opposite-direction simultaneous sales.
      for (const id of [buyerUserId, sellerUserId].sort())
        await this.operations.settleInTransaction(tx, id, id === buyerUserId, now);
      const listing = await tx.experimentalHybridListing.findUniqueOrThrow({
        where: { id: listingId },
      });
      const buyer = await tx.park.findUniqueOrThrow({
        where: { userId: buyerUserId },
        select: { id: true },
      });
      if (listing.buyerParkId === buyer.id && listing.soldAt) return response(tx, now);
      if (!listing.activeSlot) throw new BadRequestException('판매가 끝난 매물이에요.');
      const key = { parkId: buyer.id, lineageId: listing.lineageId };
      const owned = await tx.experimentalHybridRecipe.findUnique({
        where: { parkId_lineageId: key },
        select: { parkId: true },
      });
      if (owned) throw new BadRequestException('이미 연구소에 등록한 연구자료예요.');
      const paid = await tx.currency.updateMany({
        where: { userId: buyerUserId, gold: { gte: listing.price } },
        data: { gold: { decrement: listing.price } },
      });
      if (!paid.count) throw new BadRequestException('골드가 부족해요.');
      const sellerPaidGold = Math.min(
        listing.price,
        await this.sellerSpace(tx, sellerUserId, listing.sellerParkId, now),
      );
      const offer = await tx.experimentalHybridListing.updateMany({
        where: { id: listing.id, activeSlot: listing.activeSlot },
        data: { activeSlot: null, buyerParkId: buyer.id, soldAt: now, sellerPaidGold },
      });
      if (!offer.count) throw new BadRequestException('판매가 끝난 매물이에요.');
      await tx.experimentalHybridRecipe.create({
        data: { ...key, source: 'market', learnedAt: now },
      });
      await this.recordPurchase(tx, buyerUserId, listing.price);
      await this.paySeller(tx, sellerUserId, sellerPaidGold, '야시장 연구자료 판매');
      return response(tx, now);
    });
  }

  private async recordPurchase(tx: Tx, buyerUserId: string, price: number) {
    const buyer = await tx.currency.findUniqueOrThrow({
      where: { userId: buyerUserId },
      select: { gold: true },
    });
    await tx.transaction.create({
      data: {
        userId: buyerUserId,
        type: 'SPEND',
        currencyType: 'gold',
        amount: -price,
        balanceAfter: buyer.gold,
        reason: '야시장 연구자료 구매',
      },
    });
  }

  private async paySeller(tx: Tx, userId: string, amount: number, reason: string) {
    if (!amount) return;
    const seller = await tx.currency.update({
      where: { userId },
      data: { gold: { increment: amount } },
      select: { gold: true },
    });
    await tx.transaction.create({
      data: {
        userId,
        type: 'EARN',
        currencyType: 'gold',
        amount,
        balanceAfter: seller.gold,
        reason,
      },
    });
  }
}
