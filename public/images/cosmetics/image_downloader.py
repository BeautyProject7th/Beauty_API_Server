import urllib
import csv
import pandas as pd
import time
import os, sys
import math
import numpy

if __name__ == "__main__":
    print("Hello World")
    fields = ['brand', 'category_1', 'category_2', 'product_name', 'img_src']

    df = pd.read_csv('./naver_final.csv', skipinitialspace=True, usecols=fields)
    col_length = df.size/5
    col = 0
    while col < 2965:
        if col % 1000 == 0 :
            path = "/home/ec2-user/mijeong/node/BeautyProject/public/images/cosmetics/" + str(col/1000)
            os.mkdir(path, 0755)
            os.chdir(path);
        # if col % 10000 == 0 :
        #     path = "/home/ec2-user/mijeong/node/BeautyProject/public/image/cosmetics"
        #     os.mkdir(path, col/10000)
        if df.img_src[col] == "":
            col+=1
            continue
        elif pd.isnull(df.img_src[col]):
            col+=1
            continue
        print(col)
        print(df.img_src[col])
        urllib.urlretrieve(df.img_src[col], "cosmetics_" + str(col) + ".jpg")
        #print str(col) + "/" + str(col_length)
        col+=1
        time.sleep(1)
