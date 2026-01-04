
import { create } from 'zustand';
import { ViewType, Competitor, Product, ReviewAnalysis, AdCreative } from './types';

interface AppState {
  currentView: ViewType;
  selectedCompetitorId: string | null;
  competitors: Competitor[];
  setCurrentView: (view: ViewType) => void;
  setSelectedCompetitor: (id: string | null) => void;
  setCompetitors: (competitors: Competitor[]) => void;
  addCompetitor: (competitor: Competitor) => void;
  removeCompetitor: (id: string) => void;
  updateCompetitor: (competitor: Competitor) => void;
  // Product CRUD
  addProduct: (competitorId: string, product: Product) => void;
  updateProduct: (competitorId: string, product: Product) => void;
  removeProduct: (competitorId: string, productId: string) => void;
  
  // Ad CRUD
  addAd: (competitorId: string, ad: AdCreative) => void;
  updateAd: (competitorId: string, ad: AdCreative) => void;
  removeAd: (competitorId: string, adId: string) => void;

  setProductAnalysis: (competitorId: string, productId: string, analysis: ReviewAnalysis) => void;
  setProductReviews: (competitorId: string, productId: string, reviews: any[]) => void;
  fetchCompetitors: () => Promise<void>;
  
  // Selection
  selectedProductIds: string[];
  toggleProductSelection: (productId: string) => void;
  clearSelection: () => void;
  
  // Favorites
  favoriteProducts: Array<{
    productId: string;
    competitorId: string;
    // Save complete product object from competitors.json
    product: Product;
    // Save basic competitor info for reference
    competitorName: string;
    isDomestic?: boolean;
    savedAt?: string;
  }>;
  toggleFavoriteProduct: (product: Product, competitor: Competitor) => void;
  isProductFavorite: (productId: string) => boolean;
  fetchFavorites: () => Promise<void>;
  
  // Deep Reports
  deepReports: Array<{
    productId: string;
    competitorId: string;
    report: any;
    createdAt?: string;
    updatedAt?: string;
  }>;
  saveDeepReport: (productId: string, competitorId: string, report: any) => Promise<void>;
  getDeepReport: (productId: string) => any | null;
  fetchDeepReports: () => Promise<void>;
}

// Helper to save to server
const saveToServer = async (competitors: Competitor[]) => {
  try {
    // Strip reviews from products to avoid saving them to file (memory only)
    // Ensure all competitor fields including foundedDate are preserved
    const competitorsToSave = competitors.map(comp => ({
      ...comp,
      foundedDate: comp.foundedDate || undefined, // Ensure foundedDate is preserved
      products: comp.products?.map(prod => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { reviews, ...rest } = prod;
        return rest;
      })
    }));

    await fetch('/api/competitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(competitorsToSave),
    });
  } catch (error) {
    console.error('Failed to save to server:', error);
  }
};

export const useStore = create<AppState>((set, get) => ({
  currentView: ViewType.DASHBOARD,
  selectedCompetitorId: null,
  competitors: [], // Initial empty state, will fetch on load
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedCompetitor: (id) => set({ selectedCompetitorId: id, currentView: id ? ViewType.COMPETITOR_DETAIL : ViewType.DASHBOARD }),
  setCompetitors: (competitors) => {
      set({ competitors });
      saveToServer(competitors);
  },
  
  fetchCompetitors: async () => {
    try {
      const res = await fetch('/api/competitors');
      if (res.ok) {
        const data = await res.json();
        set({ competitors: data });
      }
    } catch (error) {
      console.error('Failed to fetch competitors:', error);
    }
  },

  addCompetitor: (competitor) => {
      set((state) => {
          const newCompetitors = [...state.competitors, competitor];
          saveToServer(newCompetitors);
          return { competitors: newCompetitors };
      });
  },
  removeCompetitor: (id) => {
      set((state) => {
          const newCompetitors = state.competitors.filter(c => c.id !== id);
          saveToServer(newCompetitors);
          return {
            competitors: newCompetitors,
            selectedCompetitorId: state.selectedCompetitorId === id ? null : state.selectedCompetitorId,
            currentView: state.selectedCompetitorId === id ? ViewType.DASHBOARD : state.currentView
          };
      });
  },
  updateCompetitor: (updatedComp) => {
      set((state) => {
        const newCompetitors = state.competitors.map(c => c.id === updatedComp.id ? updatedComp : c);
        saveToServer(newCompetitors);
        return { competitors: newCompetitors };
      });
  },

  // Product Actions
  addProduct: (competitorId, product) => {
      set((state) => {
        const newCompetitors = state.competitors.map(c => {
            if (c.id !== competitorId) return c;
            return { ...c, products: [...(c.products || []), product] };
        });
        saveToServer(newCompetitors);
        return { competitors: newCompetitors };
      });
  },
  updateProduct: (competitorId, product) => {
      set((state) => {
        const newCompetitors = state.competitors.map(c => {
            if (c.id !== competitorId) return c;
            return { ...c, products: c.products?.map(p => p.id === product.id ? product : p) || [] };
        });
        saveToServer(newCompetitors);
        return { competitors: newCompetitors };
      });
  },
  removeProduct: (competitorId, productId) => {
      set((state) => {
        const newCompetitors = state.competitors.map(c => {
            if (c.id !== competitorId) return c;
            return { ...c, products: c.products?.filter(p => p.id !== productId) || [] };
        });
        saveToServer(newCompetitors);
        return { competitors: newCompetitors };
      });
  },

  // Ad Actions
  addAd: (competitorId, ad) => {
      set((state) => {
        const newCompetitors = state.competitors.map(c => {
            if (c.id !== competitorId) return c;
            return { ...c, ads: [...(c.ads || []), ad] };
        });
        saveToServer(newCompetitors);
        return { competitors: newCompetitors };
      });
  },
  updateAd: (competitorId, ad) => {
      set((state) => {
        const newCompetitors = state.competitors.map(c => {
            if (c.id !== competitorId) return c;
            return { ...c, ads: c.ads?.map(a => a.id === ad.id ? ad : a) || [] };
        });
        saveToServer(newCompetitors);
        return { competitors: newCompetitors };
      });
  },
  removeAd: (competitorId, adId) => {
      set((state) => {
        const newCompetitors = state.competitors.map(c => {
            if (c.id !== competitorId) return c;
            return { ...c, ads: c.ads?.filter(a => a.id !== adId) || [] };
        });
        saveToServer(newCompetitors);
        return { competitors: newCompetitors };
      });
  },

  setProductAnalysis: (competitorId, productId, analysis) => {
      set((state) => {
        const newCompetitors = state.competitors.map(c => {
          if (c.id !== competitorId) return c;
          const updatedProducts = c.products?.map(p => {
            if (p.id !== productId) return p;
            return { ...p, analysis };
          }) || [];
          return { ...c, products: updatedProducts };
        });
        saveToServer(newCompetitors);
        return { competitors: newCompetitors };
      });
  },
  setProductReviews: (competitorId, productId, newReviews) => {
      set((state) => {
        const newCompetitors = state.competitors.map(c => {
          if (c.id !== competitorId) return c;
          const updatedProducts = c.products?.map(p => {
            if (p.id !== productId) return p;
            // Overwrite existing reviews
            const reviewObjects = newReviews.map((reviewData, idx) => ({
                id: `new-${Date.now()}-${idx}`,
                text: typeof reviewData === 'object' ? JSON.stringify(reviewData) : String(reviewData),
                sentiment: 'positive' as const,
                keywords: []
            }));
            return { ...p, reviews: reviewObjects };
          }) || [];
          return { ...c, products: updatedProducts };
        });
        saveToServer(newCompetitors);
        return { competitors: newCompetitors };
      });
  },

  // Selection Actions
  selectedProductIds: [],
  toggleProductSelection: (productId) => {
    set((state) => {
      const isSelected = state.selectedProductIds.includes(productId);
      const newSelection = isSelected 
        ? state.selectedProductIds.filter(id => id !== productId)
        : [...state.selectedProductIds, productId];
      return { selectedProductIds: newSelection };
    });
  },
  clearSelection: () => set({ selectedProductIds: [] }),
  
  // Favorites Actions
  favoriteProducts: [],
  toggleFavoriteProduct: async (product, competitor) => {
    set((state) => {
      const existingIndex = state.favoriteProducts.findIndex(
        fav => fav.productId === product.id
      );
      let newFavorites;
      if (existingIndex >= 0) {
        newFavorites = state.favoriteProducts.filter(
          (_, index) => index !== existingIndex
        );
      } else {
        // Save complete product object from competitors.json
        newFavorites = [...state.favoriteProducts, {
          productId: product.id,
          competitorId: competitor.id,
          product: { ...product }, // Save complete product object
          competitorName: competitor.name,
          isDomestic: competitor.isDomestic ?? true,
          savedAt: new Date().toISOString()
        }];
      }
      
      // Save to server
      fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFavorites),
      }).catch(error => {
        console.error('Failed to save favorites:', error);
      });
      
      return { favoriteProducts: newFavorites };
    });
  },
  isProductFavorite: (productId) => {
    return get().favoriteProducts.some(fav => fav.productId === productId);
  },
  fetchFavorites: async () => {
    try {
      const res = await fetch('/api/favorites');
      if (res.ok) {
        const data = await res.json();
        // Migrate old format to new format if needed
        const migratedData = data.map((fav: any) => {
          // If it's already in new format (has product field), return as is
          if (fav.product) {
            return fav;
          }
          // Migrate from old format to new format
          if (fav.productName) {
            return {
              productId: fav.productId,
              competitorId: fav.competitorId,
              product: {
                id: fav.productId,
                name: fav.productName,
                price: fav.productPrice,
                tags: fav.productTags || [],
                category: fav.productCategory,
                image: fav.productImage,
                competitorId: fav.competitorId,
              } as Product,
              competitorName: fav.competitorName,
              isDomestic: fav.isDomestic,
              savedAt: fav.savedAt,
            };
          }
          return fav;
        });
        set({ favoriteProducts: migratedData });
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  },
  
  // Deep Reports Actions
  deepReports: [],
  saveDeepReport: async (productId, competitorId, report) => {
    try {
      await fetch('/api/deep-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, competitorId, report })
      });
      // Refresh reports after saving
      get().fetchDeepReports();
    } catch (error) {
      console.error('Failed to save deep report:', error);
      throw error;
    }
  },
  getDeepReport: (productId) => {
    const report = get().deepReports.find(r => r.productId === productId);
    return report ? report.report : null;
  },
  fetchDeepReports: async () => {
    try {
      const res = await fetch('/api/deep-reports');
      if (res.ok) {
        const data = await res.json();
        set({ deepReports: data });
      }
    } catch (error) {
      console.error('Failed to fetch deep reports:', error);
    }
  },
}));
