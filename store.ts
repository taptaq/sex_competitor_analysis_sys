
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
}

// Helper to save to server
const saveToServer = async (competitors: Competitor[]) => {
  try {
    // Strip reviews from products to avoid saving them to file (memory only)
    const competitorsToSave = competitors.map(comp => ({
      ...comp,
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
  }
}));
