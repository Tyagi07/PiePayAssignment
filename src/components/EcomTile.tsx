// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  Pressable,
  Modal,
  BackHandler,
} from 'react-native';
import WebView from 'react-native-webview';

const windowWidth = Dimensions.get('window').width;
const itemsPerRow = 4;
const circleSize = windowWidth * 0.2; // 20% of width

// Fallback images for broken URLs
const FALLBACK_IMAGES = {
  flipkart: 'https://logos-world.net/wp-content/uploads/2020/11/Flipkart-Logo.png',
  mobiles: 'https://img.icons8.com/color/96/smartphone.png',
  fashion: 'https://img.icons8.com/color/96/clothes.png',
  electronics: 'https://img.icons8.com/color/96/laptop.png',
  home: 'https://img.icons8.com/color/96/home.png',
  beauty: 'https://img.icons8.com/color/96/cosmetics.png',
  toys: 'https://img.icons8.com/color/96/teddy-bear.png',
};

const EcomTile = React.memo(({ merchant, onPress }) => {
  const { name, categories, logoUrl } = merchant;

  // FIX: Prevent array mutation 
  const safeCategories = React.useMemo(() => {
    const cats = [...categories];
    if (cats.length > 0) {
      cats.push({
        title: 'More',
        imageUrl: 'https://img.icons8.com/color/96/000000/more.png',
      });
    }
    return cats;
  }, [categories]);
  
  // Limit to two rows by default, allow expand/collapse
  const [expanded, setExpanded] = useState(false);
  const [webUri, setWebUri] = useState(null);

  //FIX: Android back button handler
  React.useEffect(()=>{
    const backHandler = BackHandler.addEventListener('hardwareBackPress',()=>{
      if (webUri){
        setWebUri(null);
        return true; // Prevent default behavior
      }
      return false;
    });
    return () => backHandler.remove();
  }, [webUri]);

  const visibleCategories = expanded ? safeCategories : safeCategories.slice(0, 7);

  const rows = [];
  for (let i = 0; i < visibleCategories.length; i += itemsPerRow) {
    rows.push(visibleCategories.slice(i, i + itemsPerRow));
  }

  const handleToggle = () => setExpanded(!expanded);

  //Fix: Image with fallback
  const ImageWithFallback = ({ uri, style, fallbackKey }) => {
    const [imageSource, setImageSource] = useState({ uri });
    return (
      <Image
      source={imageSource}
      style={style}
      onError={()=> {
        const fallback = FALLBACK_IMAGES[fallbackKey] || FALLBACK_IMAGES.flipkart;
        setImageSource({ uri: fallback });
        }}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={onPress}>
        <View style={styles.headerRow}>
          <ImageWithFallback 
            uri={logoUrl} 
            style={styles.logo} 
            fallbackKey="flipkart"
          />
          <Text style={styles.headerText}>Buy on {name}</Text>
        </View>
      </Pressable>

      {/* category grid */}
      {rows.map((row, rowIdx) => (
        <View
          key={`row-${rowIdx}`}
          style={[
            styles.row,
            { justifyContent: row.length < 3 ? 'flex-start' : 'space-between' },
          ]}
        >
          {row.map((cat, idx) => (
            <Pressable
              key={`cat-${idx}`}
              style={styles.circle}
              onPress={() => {
                setWebUri(cat.productPageUrl);
              }}
            >
              <ImageWithFallback
                uri={cat.imageUrl}
                style={styles.categoryImage}
                fallbackKey={cat.title.toLowerCase()}
              />
              <Text style={styles.categoryTitle}>{cat.title}</Text>
            </Pressable>
          ))}
        </View>
      ))}

      {/* view more / less toggle */}
      {safeCategories.length > 7 && (
        <Pressable onPress={handleToggle} style={styles.viewMoreBtn}>
          <Text style={styles.viewMoreText}>
            {expanded ? 'View less' : 'View more'}
          </Text>
        </Pressable>
      )}

      {/* WebView modal */}
      <Modal visible={!!webUri} animationType="slide">
        <View style={{ flex: 1 }}>
          <Pressable style={styles.closeBtn} onPress={() => setWebUri(null)}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
          {webUri && <WebView source={{ uri: webUri }} startInLoadingState />}
        </View>
      </Modal>
    </View>
  );
});

export default EcomTile;

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  logo: {
    height: 20,
    width: 20,
  },
  headerText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '700',
    color: '#212121',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  circle: {
    width: circleSize,
    alignItems: 'center',
  },
  categoryImage: {
    width: circleSize * 0.8,
    height: circleSize * 0.8,
    borderRadius: circleSize * 0.4,
    backgroundColor: '#FFF',
  },
  categoryTitle: {
    marginTop: 6,
    fontSize: 12,
    color: '#616161',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  viewMoreBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  viewMoreText: {
    color: '#6C33DB',
    fontSize: 14,
  },
  closeBtn: {
    position: 'absolute',
    zIndex: 2,
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: '#FFF',
    fontSize: 18,
  },
});
